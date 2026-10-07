import "server-only";
import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import {
  ACTIVE_BOOKING_STATUSES,
  artistProfiles,
  availabilityRules,
  bookings,
  services,
  timeOff,
} from "@/db/schema";
import { db } from "@/lib/db";
import {
  availabilityForRange,
  nextAvailableSlot,
  slotsForDay,
  type AvailabilityInput,
  type Interval,
} from "@/lib/availability";
import { toLocalDate, type LocalDate } from "@/lib/time";

export type AvailabilityContext = Omit<AvailabilityInput, "durationMinutes">;

/**
 * Everything needed to compute slots for many artists, fetched in three
 * queries regardless of how many artists are on the page.
 */
export async function loadAvailabilityContexts(artistIds: string[], now = new Date()) {
  const contexts = new Map<string, AvailabilityContext>();
  if (!artistIds.length) return contexts;

  const [profiles, rules, busyBookings, blocks] = await Promise.all([
    db
      .select({
        id: artistProfiles.id,
        timezone: artistProfiles.timezone,
        leadTimeHours: artistProfiles.leadTimeHours,
        bookingWindowDays: artistProfiles.bookingWindowDays,
      })
      .from(artistProfiles)
      .where(inArray(artistProfiles.id, artistIds)),
    db.select().from(availabilityRules).where(inArray(availabilityRules.artistId, artistIds)),
    db
      .select({ artistId: bookings.artistId, start: bookings.startsAt, end: bookings.endsAt })
      .from(bookings)
      .where(
        and(
          inArray(bookings.artistId, artistIds),
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
          gt(bookings.endsAt, now),
          // An unpaid hold stops blocking the calendar once it expires.
          or(isNull(bookings.holdExpiresAt), gt(bookings.holdExpiresAt, now)),
        ),
      ),
    db
      .select({ artistId: timeOff.artistId, start: timeOff.startsAt, end: timeOff.endsAt })
      .from(timeOff)
      .where(and(inArray(timeOff.artistId, artistIds), gt(timeOff.endsAt, now))),
  ]);

  const busyByArtist = Map.groupBy([...busyBookings, ...blocks], (b) => b.artistId);
  const rulesByArtist = Map.groupBy(rules, (r) => r.artistId);

  for (const profile of profiles) {
    contexts.set(profile.id, {
      timezone: profile.timezone,
      leadTimeHours: profile.leadTimeHours,
      bookingWindowDays: profile.bookingWindowDays,
      rules: rulesByArtist.get(profile.id) ?? [],
      busy: (busyByArtist.get(profile.id) ?? []).map(({ start, end }): Interval => ({ start, end })),
      now,
    });
  }
  return contexts;
}

/** Shortest active service per artist, optionally within a category. */
export async function shortestServiceDurations(artistIds: string[], categorySlug?: string) {
  if (!artistIds.length) return new Map<string, number>();
  const rows = await db
    .select({ artistId: services.artistId, duration: services.durationMinutes })
    .from(services)
    .where(
      and(
        inArray(services.artistId, artistIds),
        eq(services.isActive, true),
        categorySlug ? eq(services.categorySlug, categorySlug) : undefined,
      ),
    );
  const result = new Map<string, number>();
  for (const row of rows) {
    result.set(row.artistId, Math.min(result.get(row.artistId) ?? Infinity, row.duration));
  }
  return result;
}

export type NextAvailable = { start: Date; timezone: string } | null;

/** "Next available" for each artist, based on their shortest service. */
export function computeNextAvailable(
  contexts: Map<string, AvailabilityContext>,
  durations: Map<string, number>,
  maxDays = 30,
) {
  const result = new Map<string, NextAvailable>();
  for (const [artistId, context] of contexts) {
    const duration = durations.get(artistId);
    const slot = duration ? nextAvailableSlot({ ...context, durationMinutes: duration }, maxDays) : null;
    result.set(artistId, slot ? { start: slot.start, timezone: context.timezone } : null);
  }
  return result;
}

/** Each artist's first open slot on a given local date (artists with none are absent). */
export function firstSlotOn(
  contexts: Map<string, AvailabilityContext>,
  durations: Map<string, number>,
  date: LocalDate,
) {
  const result = new Map<string, NextAvailable>();
  for (const [artistId, context] of contexts) {
    const duration = durations.get(artistId);
    if (!duration) continue;
    const [first] = slotsForDay({ ...context, durationMinutes: duration }, date);
    if (first) result.set(artistId, { start: first.start, timezone: context.timezone });
  }
  return result;
}

export type SlotDay = { date: LocalDate; slots: string[] };

/**
 * Bookable start times (ISO strings, ready to serialize to the client) for
 * one artist's service over a date range. With `seek`, a range that has no
 * openings jumps forward to start at the first date that does, so visitors
 * never land on an empty fortnight when there's room later.
 */
export async function getServiceAvailability(
  artistId: string,
  durationMinutes: number,
  from: LocalDate | null,
  days: number,
  options: { seek?: boolean } = {},
): Promise<{ timezone: string; from: LocalDate; days: SlotDay[] }> {
  const contexts = await loadAvailabilityContexts([artistId]);
  const context = contexts.get(artistId);
  if (!context) throw new Error(`No availability context for artist ${artistId}`);
  const input = { ...context, durationMinutes };
  const today = toLocalDate(context.now, context.timezone);
  let start = from && from > today ? from : today;

  let range = availabilityForRange(input, start, days);
  if (options.seek && !range.some((d) => d.slots.length)) {
    const next = nextAvailableSlot(input);
    if (next) {
      start = toLocalDate(next.start, context.timezone);
      range = availabilityForRange(input, start, days);
    }
  }

  return {
    timezone: context.timezone,
    from: start,
    days: range.map((d) => ({ date: d.date, slots: d.slots.map((s) => s.start.toISOString()) })),
  };
}
