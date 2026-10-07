import { describe, expect, it } from "vitest";
import {
  availabilityForRange,
  isSlotAvailable,
  nextAvailableSlot,
  slotsForDay,
  type AvailabilityInput,
} from "./availability";
import { zonedTimeToUtc } from "./time";

const TZ = "America/New_York";
const at = (date: string, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return zonedTimeToUtc(date, h * 60 + m, TZ);
};
const times = (slots: { start: Date }[]) =>
  slots.map((s) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(s.start),
  );

// Wednesday 2026-10-07, 8am New York.
const base: AvailabilityInput = {
  timezone: TZ,
  rules: [{ weekday: 4, startMinute: 10 * 60, endMinute: 13 * 60 }], // Thursdays 10:00–13:00
  busy: [],
  durationMinutes: 60,
  now: at("2026-10-07", "08:00"),
  leadTimeHours: 0,
  bookingWindowDays: 60,
};

describe("slotsForDay", () => {
  it("offers start times on a 30-minute grid that fit inside working hours", () => {
    expect(times(slotsForDay(base, "2026-10-08"))).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00"]);
  });

  it("returns nothing on days without working hours", () => {
    expect(slotsForDay(base, "2026-10-09")).toEqual([]);
  });

  it("supports split shifts", () => {
    const input = {
      ...base,
      rules: [
        { weekday: 4, startMinute: 9 * 60, endMinute: 10 * 60 },
        { weekday: 4, startMinute: 14 * 60, endMinute: 15 * 60 },
      ],
    };
    expect(times(slotsForDay(input, "2026-10-08"))).toEqual(["09:00", "14:00"]);
  });

  it("skips slots that overlap busy time but allows touching edges", () => {
    const input = {
      ...base,
      busy: [{ start: at("2026-10-08", "11:00"), end: at("2026-10-08", "12:00") }],
    };
    expect(times(slotsForDay(input, "2026-10-08"))).toEqual(["10:00", "12:00"]);
  });

  it("respects a buffer around busy time", () => {
    const input = {
      ...base,
      bufferMinutes: 30,
      busy: [{ start: at("2026-10-08", "11:00"), end: at("2026-10-08", "11:30") }],
    };
    // 10:00 would end at 11:00, leaving no buffer; 12:00 starts 30 min after.
    expect(times(slotsForDay(input, "2026-10-08"))).toEqual(["12:00"]);
  });

  it("enforces lead time", () => {
    const input = { ...base, now: at("2026-10-07", "10:15"), leadTimeHours: 24 };
    expect(times(slotsForDay(input, "2026-10-08"))).toEqual(["10:30", "11:00", "11:30", "12:00"]);
  });

  it("enforces the booking window", () => {
    const input = { ...base, bookingWindowDays: 7 };
    expect(slotsForDay(input, "2026-10-15")).toHaveLength(0); // 8 days out
    expect(slotsForDay(input, "2026-10-08")).not.toHaveLength(0);
  });

  it("handles the day clocks fall back (Nov 1, 2026 is a Sunday)", () => {
    const input = {
      ...base,
      now: at("2026-10-28", "08:00"),
      rules: [{ weekday: 0, startMinute: 0, endMinute: 4 * 60 }],
      durationMinutes: 60,
    };
    const slots = slotsForDay(input, "2026-11-01");
    // Wall clock 00:00–04:00 is five real hours that day; every slot is a real hour long.
    for (const slot of slots) expect(slot.end.getTime() - slot.start.getTime()).toBe(3_600_000);
    expect(new Set(slots.map((s) => s.start.getTime())).size).toBe(slots.length);
  });

  it("handles the day clocks spring forward (Mar 8, 2026 is a Sunday)", () => {
    const input = {
      ...base,
      now: at("2026-03-01", "08:00"),
      rules: [{ weekday: 0, startMinute: 60, endMinute: 4 * 60 }],
    };
    const slots = slotsForDay(input, "2026-03-08");
    // 01:00–04:00 wall clock is only two real hours; nothing may run past 04:00.
    const blockEnd = at("2026-03-08", "04:00").getTime();
    for (const slot of slots) expect(slot.end.getTime()).toBeLessThanOrEqual(blockEnd);
    expect(slots.length).toBeGreaterThan(0);
  });
});

describe("availabilityForRange", () => {
  it("returns one entry per day", () => {
    const days = availabilityForRange(base, "2026-10-07", 7);
    expect(days.map((d) => d.date)).toEqual([
      "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13",
    ]);
    expect(days.filter((d) => d.slots.length).map((d) => d.date)).toEqual(["2026-10-08"]);
  });
});

describe("nextAvailableSlot", () => {
  it("finds the first open slot, skipping fully booked days", () => {
    const input = {
      ...base,
      busy: [{ start: at("2026-10-08", "10:00"), end: at("2026-10-08", "13:00") }],
    };
    expect(nextAvailableSlot(input)?.start).toEqual(at("2026-10-15", "10:00"));
  });

  it("returns null when nothing is free in the window", () => {
    expect(nextAvailableSlot({ ...base, rules: [] })).toBeNull();
  });
});

describe("isSlotAvailable", () => {
  it("accepts offered slots and rejects off-grid or taken times", () => {
    expect(isSlotAvailable(base, at("2026-10-08", "10:30"))).toBe(true);
    expect(isSlotAvailable(base, at("2026-10-08", "10:15"))).toBe(false);
    expect(isSlotAvailable(base, at("2026-10-08", "12:30"))).toBe(false); // would run past 13:00
    const busy = { ...base, busy: [{ start: at("2026-10-08", "10:00"), end: at("2026-10-08", "11:00") }] };
    expect(isSlotAvailable(busy, at("2026-10-08", "10:30"))).toBe(false);
  });
});
