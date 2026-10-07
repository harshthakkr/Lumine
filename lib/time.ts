// Timezone helpers built on Intl, so they work identically on the server,
// in scripts and in the browser without a date library.

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ZonedParts = {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
};

/** Wall-clock components of `date` as seen in `timeZone`. */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(date)) {
    parts[type] = value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (e.g. -4h for New York in summer). */
function offsetMs(date: Date, timeZone: string) {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/** A calendar date with no time or zone, as "YYYY-MM-DD". */
export type LocalDate = string;

/**
 * The instant at which the wall clock in `timeZone` reads `date` +
 * `minutes` after midnight. Times skipped by a DST jump resolve forward.
 */
export function zonedTimeToUtc(date: LocalDate, minutes: number, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const wallClockAsUtc = Date.UTC(y, m - 1, d, 0, minutes);
  // Two passes handle instants whose offset differs from the initial guess (DST boundaries).
  let guess = wallClockAsUtc - offsetMs(new Date(wallClockAsUtc), timeZone);
  guess = wallClockAsUtc - offsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

/** The calendar date of `date` in `timeZone`. */
export function toLocalDate(date: Date, timeZone: string): LocalDate {
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** 0 = Sunday, independent of any timezone. */
export function weekdayOf(date: LocalDate): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
