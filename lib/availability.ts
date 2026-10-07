// Slot computation. Pure functions with no database access, so the same
// logic powers previews ("next available"), the slot picker, search
// filters and server-side validation when a booking is created.

import { addDays, toLocalDate, weekdayOf, zonedTimeToUtc, type LocalDate } from "./time";

export type WeeklyRule = { weekday: number; startMinute: number; endMinute: number };
export type Interval = { start: Date; end: Date };
export type Slot = Interval;

export type AvailabilityInput = {
  timezone: string;
  /** Recurring working hours in the artist's local time. */
  rules: WeeklyRule[];
  /** Already-taken time: active bookings and time off. */
  busy: Interval[];
  durationMinutes: number;
  now: Date;
  /** Minimum notice before a slot can start. */
  leadTimeHours: number;
  /** Slots are offered through the end of this many days from today. */
  bookingWindowDays: number;
  /** Grid for start times, measured from the start of each working block. */
  stepMinutes?: number;
  /** Free time required between this slot and any busy interval. */
  bufferMinutes?: number;
};

export type DayAvailability = { date: LocalDate; slots: Slot[] };

const MINUTE = 60_000;
export const DEFAULT_STEP_MINUTES = 30;
/** Days of availability shown per page in the slot picker. */
export const SLOT_PAGE_DAYS = 14;

function overlapsAny(busy: Interval[], start: number, end: number) {
  for (const b of busy) {
    if (start < b.end.getTime() && b.start.getTime() < end) return true;
  }
  return false;
}

/** First local date on which nothing can be booked any more. */
function windowEnd(input: AvailabilityInput): LocalDate {
  return addDays(toLocalDate(input.now, input.timezone), input.bookingWindowDays + 1);
}

/** Bookable slots on a single local calendar date. */
export function slotsForDay(input: AvailabilityInput, date: LocalDate): Slot[] {
  if (date >= windowEnd(input)) return [];

  const step = input.stepMinutes ?? DEFAULT_STEP_MINUTES;
  const buffer = (input.bufferMinutes ?? 0) * MINUTE;
  const duration = input.durationMinutes * MINUTE;
  const earliest = input.now.getTime() + input.leadTimeHours * 60 * MINUTE;
  const weekday = weekdayOf(date);

  const starts = new Set<number>();
  for (const rule of input.rules) {
    if (rule.weekday !== weekday) continue;
    for (let m = rule.startMinute; m + input.durationMinutes <= rule.endMinute; m += step) {
      const start = zonedTimeToUtc(date, m, input.timezone).getTime();
      // On DST transition days the wall clock and real elapsed time differ;
      // require the real end to fall within the block as well.
      const blockEnd = zonedTimeToUtc(date, rule.endMinute, input.timezone).getTime();
      if (start + duration > blockEnd) continue;
      if (start < earliest) continue;
      if (overlapsAny(input.busy, start - buffer, start + duration + buffer)) continue;
      starts.add(start);
    }
  }

  return [...starts]
    .sort((a, b) => a - b)
    .map((start) => ({ start: new Date(start), end: new Date(start + duration) }));
}

/** Availability for `days` consecutive dates starting at `from`. */
export function availabilityForRange(
  input: AvailabilityInput,
  from: LocalDate,
  days: number,
): DayAvailability[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    return { date, slots: slotsForDay(input, date) };
  });
}

/** The earliest bookable slot within the booking window, or null. */
export function nextAvailableSlot(input: AvailabilityInput, maxDays = input.bookingWindowDays): Slot | null {
  const today = toLocalDate(input.now, input.timezone);
  for (let i = 0; i <= maxDays; i++) {
    const [first] = slotsForDay(input, addDays(today, i));
    if (first) return first;
  }
  return null;
}

/** Whether `start` is exactly one of the slots offered on its day. */
export function isSlotAvailable(input: AvailabilityInput, start: Date): boolean {
  const date = toLocalDate(start, input.timezone);
  return slotsForDay(input, date).some((s) => s.start.getTime() === start.getTime());
}
