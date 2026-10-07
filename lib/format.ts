import { addDays, toLocalDate } from "./time";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatPrice = (cents: number) => usd.format(cents / 100);

export function formatRating(rating: number | null | undefined) {
  // Two decimals: rounding 4.96 to "5.0" would overstate it.
  return rating == null ? "New" : rating.toFixed(2);
}

export function formatDay(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTimeRange(start: Date, end: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).formatRange(start, end);
}

/** "Mon", "14", "Oct" pieces for calendar-style date badges. */
export function dateBadge(date: Date, timeZone: string) {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(date);
  return {
    weekday: part({ weekday: "short" }),
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
  };
}

const relative = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

export function formatRelative(date: Date, now = new Date()) {
  const diffMinutes = Math.round((date.getTime() - now.getTime()) / 60_000);
  const abs = Math.abs(diffMinutes);
  if (abs < 1) return "just now";
  if (abs < 60) return relative.format(diffMinutes, "minute");
  if (abs < 60 * 24) return relative.format(Math.round(diffMinutes / 60), "hour");
  return relative.format(Math.round(diffMinutes / (60 * 24)), "day");
}

export const firstName = (name: string) => name.split(" ")[0];

/** "Today, 3:00 PM" · "Tomorrow, 10:30 AM" · "Thu, Oct 9" (relative to the artist's timezone). */
export function formatNextAvailable(start: Date, timeZone: string, options: { withTime?: boolean; now?: Date } = {}) {
  const today = toLocalDate(options.now ?? new Date(), timeZone);
  const day = toLocalDate(start, timeZone);
  if (day === today) return `Today, ${formatTime(start, timeZone)}`;
  if (day === addDays(today, 1)) return `Tomorrow, ${formatTime(start, timeZone)}`;
  return options.withTime ? `${formatDay(start, timeZone)}, ${formatTime(start, timeZone)}` : formatDay(start, timeZone);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function pluralize(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}
