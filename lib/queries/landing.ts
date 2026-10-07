import "server-only";
import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { artistCategories, artistProfiles, bookings, categories, reviews, services, users } from "@/db/schema";
import { db } from "@/lib/db";
import { parseSearchParams } from "@/lib/search-params";
import { searchArtists, type ArtistCard } from "./artists";

const publicArtist = and(eq(artistProfiles.isPublished, true), isNull(users.demoWorkspaceId));

/** Headline numbers for the hero, computed from real rows. */
export async function getLandingStats() {
  const [[artists], [ratings], [booked]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(artistProfiles)
      .innerJoin(users, eq(users.id, artistProfiles.userId))
      .where(publicArtist),
    db
      .select({
        avg: sql<number>`round(avg(${reviews.rating})::numeric, 1)`.mapWith(Number),
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .innerJoin(artistProfiles, eq(artistProfiles.id, reviews.artistId))
      .innerJoin(users, eq(users.id, artistProfiles.userId))
      .where(publicArtist),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.status, "completed")),
  ]);
  return { artists: artists.count, avgRating: ratings.avg, reviews: ratings.count, completed: booked.count };
}

/** Categories with how many artists offer them and the lowest starting price. */
export async function getOccasions() {
  return db
    .select({
      slug: categories.slug,
      name: categories.name,
      tagline: categories.tagline,
      imageUrl: categories.imageUrl,
      artistCount: sql<number>`count(distinct ${artistCategories.artistId})::int`,
      fromCents: sql<number>`min(${services.priceCents})::int`,
    })
    .from(categories)
    .innerJoin(artistCategories, eq(artistCategories.categorySlug, categories.slug))
    .innerJoin(artistProfiles, eq(artistProfiles.id, artistCategories.artistId))
    .innerJoin(users, eq(users.id, artistProfiles.userId))
    .innerJoin(
      services,
      and(eq(services.artistId, artistProfiles.id), eq(services.categorySlug, categories.slug), eq(services.isActive, true)),
    )
    .where(publicArtist)
    .groupBy(categories.slug)
    .orderBy(asc(categories.sortOrder));
}

/** Top-ranked artists who have an opening in the next week. */
export async function getFeaturedArtists(limit = 4): Promise<ArtistCard[]> {
  const all = await searchArtists(parseSearchParams({}));
  const weekOut = Date.now() + 7 * 86_400_000;
  return all
    .filter((a) => !a.isOwnDemo && a.nextAvailable && a.nextAvailable.start.getTime() < weekOut)
    .slice(0, limit);
}

/** Recent five-star reviews with real substance, one per artist. */
export async function getFeaturedReviews(limit = 3) {
  const rows = await db
    .select({
      id: reviews.id,
      body: reviews.body,
      authorName: sql<string>`${users.name}`,
      serviceName: bookings.serviceName,
      artistName: artistProfiles.displayName,
      artistSlug: artistProfiles.slug,
      artistAvatar: artistProfiles.avatarUrl,
      artistId: artistProfiles.id,
    })
    .from(reviews)
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .innerJoin(artistProfiles, eq(artistProfiles.id, reviews.artistId))
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(
      and(
        eq(reviews.rating, 5),
        gte(sql`length(${reviews.body})`, 90),
        eq(artistProfiles.isPublished, true),
        // Never feature a visitor's private demo artist.
        sql`not exists (select 1 from users au where au.id = ${artistProfiles.userId} and au.demo_workspace_id is not null)`,
      ),
    )
    .orderBy(desc(reviews.createdAt))
    .limit(60);

  const seen = new Set<string>();
  return rows
    .filter((r) => !seen.has(r.artistId) && seen.add(r.artistId))
    .slice(0, limit)
    .map((r) => {
      const [first, ...rest] = r.authorName.split(" ");
      return { ...r, authorName: rest.length ? `${first} ${rest.at(-1)![0]}.` : first };
    });
}
