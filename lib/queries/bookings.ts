import "server-only";
import { and, asc, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import { artistProfiles, bookings, reviews, users } from "@/db/schema";
import { db } from "@/lib/db";

const DAY_MS = 86_400_000;

export type ClientBooking = Awaited<ReturnType<typeof getClientBookings>>["upcoming"][number];

export async function getClientBookings(clientId: string) {
  const rows = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      serviceName: bookings.serviceName,
      priceCents: bookings.priceCents,
      location: bookings.location,
      address: bookings.address,
      artist: {
        name: artistProfiles.displayName,
        slug: artistProfiles.slug,
        avatarUrl: artistProfiles.avatarUrl,
        neighborhood: artistProfiles.neighborhood,
        timezone: artistProfiles.timezone,
      },
      reviewRating: reviews.rating,
    })
    .from(bookings)
    .innerJoin(artistProfiles, eq(artistProfiles.id, bookings.artistId))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(eq(bookings.clientId, clientId))
    .orderBy(asc(bookings.startsAt));

  const now = Date.now();
  return {
    upcoming: rows.filter((b) => b.endsAt.getTime() >= now && b.status !== "expired"),
    past: rows.filter((b) => b.endsAt.getTime() < now).reverse(),
  };
}

export type ArtistBooking = Awaited<ReturnType<typeof getArtistBookings>>["upcoming"][number];

/** All of an artist's bookings, grouped the way an artist thinks about them. */
export async function getArtistBookings(artistId: string) {
  const rows = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      serviceName: bookings.serviceName,
      priceCents: bookings.priceCents,
      location: bookings.location,
      address: bookings.address,
      clientName: users.name,
      clientImage: users.image,
      reviewRating: reviews.rating,
    })
    .from(bookings)
    .innerJoin(users, eq(users.id, bookings.clientId))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(and(eq(bookings.artistId, artistId), gte(bookings.startsAt, new Date(Date.now() - 90 * DAY_MS))))
    .orderBy(asc(bookings.startsAt));

  const now = Date.now();
  const future = rows.filter((b) => b.endsAt.getTime() >= now);
  return {
    requests: future.filter((b) => b.status === "requested"),
    upcoming: future.filter((b) => b.status === "confirmed"),
    past: rows.filter((b) => b.endsAt.getTime() < now && b.status !== "expired").reverse(),
  };
}

export async function getArtistProfileForUser(userId: string) {
  const [profile] = await db
    .select()
    .from(artistProfiles)
    .where(eq(artistProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export type DashboardBooking = Awaited<ReturnType<typeof getArtistDashboard>>["upcoming"][number];

export async function getArtistDashboard(artistId: string) {
  const now = new Date();
  const bookingFields = {
    id: bookings.id,
    reference: bookings.reference,
    status: bookings.status,
    startsAt: bookings.startsAt,
    endsAt: bookings.endsAt,
    serviceName: bookings.serviceName,
    priceCents: bookings.priceCents,
    location: bookings.location,
    address: bookings.address,
    notes: bookings.notes,
    createdAt: bookings.createdAt,
    clientName: users.name,
    clientImage: users.image,
  };

  const [requests, upcoming, [stats]] = await Promise.all([
    db
      .select(bookingFields)
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.clientId))
      .where(
        and(
          eq(bookings.artistId, artistId),
          eq(bookings.status, "requested"),
          gte(bookings.startsAt, now),
        ),
      )
      // Inbox order: the newest request first.
      .orderBy(desc(bookings.createdAt)),
    db
      .select(bookingFields)
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.clientId))
      .where(
        and(
          eq(bookings.artistId, artistId),
          eq(bookings.status, "confirmed"),
          gte(bookings.endsAt, now),
          lt(bookings.startsAt, new Date(now.getTime() + 14 * DAY_MS)),
        ),
      )
      .orderBy(asc(bookings.startsAt)),
    db
      .select({
        upcomingWeek: sql<number>`count(*) filter (
          where ${bookings.status} = 'confirmed'
            and ${bookings.startsAt} between now() and now() + interval '7 days'
        )`.mapWith(Number),
        earnings30d: sql<number>`coalesce(sum(${bookings.priceCents}) filter (
          where ${bookings.status} = 'completed'
            and ${bookings.startsAt} >= now() - interval '30 days'
        ), 0)`.mapWith(Number),
        earningsPrev30d: sql<number>`coalesce(sum(${bookings.priceCents}) filter (
          where ${bookings.status} = 'completed'
            and ${bookings.startsAt} >= now() - interval '60 days'
            and ${bookings.startsAt} < now() - interval '30 days'
        ), 0)`.mapWith(Number),
        completed30d: sql<number>`count(*) filter (
          where ${bookings.status} = 'completed'
            and ${bookings.startsAt} >= now() - interval '30 days'
        )`.mapWith(Number),
      })
      .from(bookings)
      .where(eq(bookings.artistId, artistId)),
  ]);

  const latestReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      authorName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(eq(reviews.artistId, artistId))
    .orderBy(desc(reviews.createdAt))
    .limit(3);

  return { requests, upcoming, stats, latestReviews };
}

export type RequestDecision = "accept" | "decline";

/**
 * Accept or decline a pending request. Scoped to the artist and to the
 * `requested` status, so a stale tab can't flip a booking twice.
 */
export async function respondToRequest(artistId: string, bookingId: string, decision: RequestDecision) {
  const [updated] = await db
    .update(bookings)
    .set({ status: decision === "accept" ? "confirmed" : "declined" })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.artistId, artistId),
        inArray(bookings.status, ["requested"]),
      ),
    )
    .returning({ id: bookings.id, status: bookings.status });
  return updated ?? null;
}

/**
 * A single booking, visible to its client or its artist only. Anyone else
 * gets null, which pages turn into a 404 so references can't be probed.
 */
export async function getBookingForViewer(reference: string, viewerId: string) {
  const [row] = await db
    .select({
      booking: bookings,
      artist: {
        id: artistProfiles.id,
        userId: artistProfiles.userId,
        name: artistProfiles.displayName,
        slug: artistProfiles.slug,
        avatarUrl: artistProfiles.avatarUrl,
        neighborhood: artistProfiles.neighborhood,
        borough: artistProfiles.borough,
        timezone: artistProfiles.timezone,
        cancellationPolicy: artistProfiles.cancellationPolicy,
      },
      clientName: users.name,
    })
    .from(bookings)
    .innerJoin(artistProfiles, eq(artistProfiles.id, bookings.artistId))
    .innerJoin(users, eq(users.id, bookings.clientId))
    .where(
      and(
        eq(bookings.reference, reference),
        or(eq(bookings.clientId, viewerId), eq(artistProfiles.userId, viewerId)),
      ),
    )
    .limit(1);
  return row ?? null;
}
