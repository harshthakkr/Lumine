import { describe, expect, it } from "vitest";
import { formatDuration, formatNextAvailable, formatPrice, formatRating, formatRelative } from "./format";

const TZ = "America/New_York";
const now = new Date("2026-10-07T14:00:00Z"); // Wed 10:00 in New York

describe("formatNextAvailable", () => {
  it("uses relative day names for today and tomorrow", () => {
    expect(formatNextAvailable(new Date("2026-10-07T19:00:00Z"), TZ, { now })).toBe("Today, 3:00 PM");
    expect(formatNextAvailable(new Date("2026-10-08T14:30:00Z"), TZ, { now })).toBe("Tomorrow, 10:30 AM");
  });

  it("judges 'today' in the artist's timezone, not UTC", () => {
    // 02:00 UTC on the 8th is still the evening of the 7th in New York.
    expect(formatNextAvailable(new Date("2026-10-08T02:00:00Z"), TZ, { now })).toBe("Today, 10:00 PM");
  });

  it("shows a date further out, with time only when asked", () => {
    const later = new Date("2026-10-10T15:00:00Z");
    expect(formatNextAvailable(later, TZ, { now })).toBe("Sat, Oct 10");
    expect(formatNextAvailable(later, TZ, { now, withTime: true })).toBe("Sat, Oct 10, 11:00 AM");
  });
});

describe("small formatters", () => {
  it("formats durations, prices and ratings", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatPrice(15000)).toBe("$150");
    expect(formatRating(4.96)).toBe("4.96");
    expect(formatRating(null)).toBe("New");
  });

  it("formats relative times", () => {
    expect(formatRelative(new Date(now.getTime() + 20_000), now)).toBe("just now");
    expect(formatRelative(new Date(now.getTime() - 3 * 3_600_000), now)).toBe("3 hours ago");
    expect(formatRelative(new Date(now.getTime() + 2 * 86_400_000), now)).toBe("in 2 days");
  });
});
