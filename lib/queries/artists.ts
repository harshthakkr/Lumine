import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import {
  artistCategories,
  artistProfiles,
  bookings,
  categories,
  favorites,
  portfolioImages,
  reviews,
  services,
  users,
} from "@/db/schema";
import { db } from "@/lib/db";
import type { SearchFilters } from "@/lib/search-params";
import {
  computeNextAvailable,
  firstSlotOn,
  loadAvailabilityContexts,
  shortestServiceDurations,
  type NextAvailable,
} from "./availability";

/**
 * Artists anyone can see, plus the viewer's own demo artist (demo
 * artists are private to the workspace that created them).
 */
export function visibleArtists(viewerWorkspaceId: string | null | undefined): SQL {
  return and(
    eq(artistProfiles.isPublished, true),
    viewerWorkspaceId
      ? or(isNull(users.demoWorkspaceId), eq(users.demoWorkspaceId, viewerWorkspaceId))
      : isNull(users.demoWorkspaceId),
  )!;
}

// Bayesian average: pulls ratings with few reviews toward a prior so a
// 5.0 from 3 reviews doesn't outrank a 4.9 from 80.
const PRIOR_MEAN = 4.5;
const PRIOR_WEIGHT = 10;
// Constants are inlined (not bound as parameters) so Postgres can infer numeric types.
const prior = { mean: sql.raw(PRIOR_MEAN.toFixed(2)), weight: sql.raw(String(PRIOR_WEIGHT)) };
const rankScore = sql<number>`(
  (${prior.mean} * ${prior.weight} + coalesce(${artistProfiles.ratingAvg}, 0) * ${artistProfiles.reviewCount})
  / (${prior.weight} + ${artistProfiles.reviewCount})
)`;

const coverImage = sql<string | null>`(
  select ${portfolioImages.url} from ${portfolioImages}
  where ${portfolioImages.artistId} = ${artistProfiles.id}
  order by ${portfolioImages.sortOrder} limit 1
)`;

function startingPriceIn(categorySlug?: string) {
  return sql<number | null>`(
    select min(${services.priceCents}) from ${services}
    where ${services.artistId} = ${artistProfiles.id}
      and ${services.isActive}
      ${categorySlug ? sql`and ${services.categorySlug} = ${categorySlug}` : sql``}
  )`;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

export type ArtistCard = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  avatarUrl: string;
  coverUrl: string | null;
  neighborhood: string;
  borough: string;
  ratingAvg: number | null;
  reviewCount: number;
  isVerified: boolean;
  instantBook: boolean;
  startingPriceCents: number;
  isOwnDemo: boolean;
  nextAvailable: NextAvailable;
};

function cardFields(price: SQL<number | null>) {
  return {
    id: artistProfiles.id,
    slug: artistProfiles.slug,
    name: artistProfiles.displayName,
    headline: artistProfiles.headline,
    avatarUrl: artistProfiles.avatarUrl,
    coverUrl: coverImage,
    neighborhood: artistProfiles.neighborhood,
    borough: artistProfiles.borough,
    ratingAvg: artistProfiles.ratingAvg,
    reviewCount: artistProfiles.reviewCount,
    isVerified: artistProfiles.isVerified,
    instantBook: artistProfiles.instantBook,
    startingPriceCents: price.mapWith(Number),
    isOwnDemo: sql<boolean>`${users.demoWorkspaceId} is not null`,
  };
}

async function withNextAvailable<T extends { id: string }>(rows: T[], categorySlug?: string) {
  const ids = rows.map((r) => r.id);
  const [contexts, durations] = await Promise.all([
    loadAvailabilityContexts(ids),
    shortestServiceDurations(ids, categorySlug),
  ]);
  const next = computeNextAvailable(contexts, durations);
  return { contexts, durations, rows: rows.map((r) => ({ ...r, nextAvailable: next.get(r.id) ?? null })) };
}

/** Discovery search. Every filter maps to SQL except "available on", which needs the slot engine. */
export async function searchArtists(
  filters: SearchFilters,
  viewerWorkspaceId?: string | null,
): Promise<ArtistCard[]> {
  const price = startingPriceIn(filters.category);
  const conditions: (SQL | undefined)[] = [visibleArtists(viewerWorkspaceId), sql`${price} is not null`];

  if (filters.q) {
    const term = `%${escapeLike(filters.q)}%`;
    conditions.push(
      or(
        ilike(artistProfiles.displayName, term),
        ilike(artistProfiles.headline, term),
        ilike(artistProfiles.neighborhood, term),
        ilike(artistProfiles.borough, term),
        sql`exists (select 1 from ${services} where ${services.artistId} = ${artistProfiles.id}
          and ${services.isActive} and ${services.name} ilike ${term})`,
      ),
    );
  }
  if (filters.area.length) conditions.push(inArray(artistProfiles.borough, filters.area));
  if (filters.maxPrice) conditions.push(sql`${price} <= ${Math.round(filters.maxPrice * 100)}`);
  if (filters.minRating) conditions.push(gte(artistProfiles.ratingAvg, filters.minRating));
  if (filters.instant) conditions.push(eq(artistProfiles.instantBook, true));
  if (filters.location === "studio") conditions.push(eq(artistProfiles.offersStudio, true));
  if (filters.location === "client") conditions.push(eq(artistProfiles.travelsToClient, true));

  const order = {
    recommended: [sql`${rankScore} desc`],
    rating: [sql`${artistProfiles.ratingAvg} desc nulls last`, desc(artistProfiles.reviewCount)],
    reviews: [desc(artistProfiles.reviewCount)],
    price_asc: [sql`${price} asc`],
    price_desc: [sql`${price} desc`],
  }[filters.sort];

  const rows = await db
    .select(cardFields(price))
    .from(artistProfiles)
    .innerJoin(users, eq(users.id, artistProfiles.userId))
    .where(and(...conditions))
    // The viewer's own demo artist is pinned first so they can find themselves.
    .orderBy(sql`${users.demoWorkspaceId} is null`, ...order, asc(artistProfiles.displayName));

  const result = await withNextAvailable(rows, filters.category);
  if (!filters.date) return result.rows;
  // With a date chosen, "next available" means the first opening that day.
  const onDate = firstSlotOn(result.contexts, result.durations, filters.date);
  return result.rows.filter((r) => onDate.has(r.id)).map((r) => ({ ...r, nextAvailable: onDate.get(r.id)! }));
}

// ---------------------------------------------------------------------------
// Profile

export async function getArtistProfile(slug: string, viewerWorkspaceId?: string | null) {
  const [row] = await db
    .select({
      profile: artistProfiles,
      joinedAt: users.createdAt,
      isOwnDemo: sql<boolean>`${users.demoWorkspaceId} is not null`,
    })
    .from(artistProfiles)
    .innerJoin(users, eq(users.id, artistProfiles.userId))
    .where(and(eq(artistProfiles.slug, slug), visibleArtists(viewerWorkspaceId)))
    .limit(1);
  if (!row) return null;

  const artistId = row.profile.id;
  const [menu, portfolio, categoryRows, distribution, [completed]] = await Promise.all([
    db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        durationMinutes: services.durationMinutes,
        priceCents: services.priceCents,
        categorySlug: services.categorySlug,
        categoryName: categories.name,
      })
      .from(services)
      .innerJoin(categories, eq(categories.slug, services.categorySlug))
      .where(and(eq(services.artistId, artistId), eq(services.isActive, true)))
      .orderBy(asc(services.sortOrder)),
    db
      .select()
      .from(portfolioImages)
      .where(eq(portfolioImages.artistId, artistId))
      .orderBy(asc(portfolioImages.sortOrder)),
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(artistCategories)
      .innerJoin(categories, eq(categories.slug, artistCategories.categorySlug))
      .where(eq(artistCategories.artistId, artistId))
      .orderBy(asc(categories.sortOrder)),
    db
      .select({ rating: reviews.rating, count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.artistId, artistId))
      .groupBy(reviews.rating),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.artistId, artistId), eq(bookings.status, "completed"))),
  ]);

  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of distribution) ratingCounts[r.rating as 1 | 2 | 3 | 4 | 5] = r.count;

  return {
    ...row.profile,
    joinedAt: row.joinedAt,
    isOwnDemo: row.isOwnDemo,
    services: menu,
    portfolio,
    categories: categoryRows,
    ratingCounts,
    completedBookings: completed?.count ?? 0,
  };
}

export type ArtistProfile = NonNullable<Awaited<ReturnType<typeof getArtistProfile>>>;
export type ArtistService = ArtistProfile["services"][number];

export const REVIEWS_PAGE_SIZE = 6;

export type ReviewItem = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  authorName: string;
  serviceName: string;
  artistReply: string | null;
  artistRepliedAt: string | null;
};

/** Public display name: first name and last initial. */
export function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
}

/** Newest-first reviews with keyset pagination; `cursor` is the last item's id. */
export async function getArtistReviews(
  artistId: string,
  options: { rating?: number; cursor?: string } = {},
): Promise<{ items: ReviewItem[]; nextCursor: string | null }> {
  let cursorCondition: SQL | undefined;
  if (options.cursor) {
    const [anchor] = await db
      .select({ createdAt: reviews.createdAt, id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.id, options.cursor), eq(reviews.artistId, artistId)))
      .limit(1);
    if (anchor) {
      cursorCondition = or(
        lt(reviews.createdAt, anchor.createdAt),
        and(eq(reviews.createdAt, anchor.createdAt), lt(reviews.id, anchor.id)),
      );
    }
  }

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      authorName: users.name,
      serviceName: bookings.serviceName,
      artistReply: reviews.artistReply,
      artistRepliedAt: reviews.artistRepliedAt,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .innerJoin(bookings, eq(bookings.id, reviews.bookingId))
    .where(
      and(
        eq(reviews.artistId, artistId),
        options.rating ? eq(reviews.rating, options.rating) : undefined,
        cursorCondition,
      ),
    )
    .orderBy(desc(reviews.createdAt), desc(reviews.id))
    .limit(REVIEWS_PAGE_SIZE + 1);

  const page = rows.slice(0, REVIEWS_PAGE_SIZE);
  return {
    items: page.map((r) => ({
      ...r,
      authorName: shortName(r.authorName),
      createdAt: r.createdAt.toISOString(),
      artistRepliedAt: r.artistRepliedAt?.toISOString() ?? null,
    })),
    nextCursor: rows.length > REVIEWS_PAGE_SIZE ? page[page.length - 1].id : null,
  };
}

export async function getSimilarArtists(
  artist: { id: string; categories: { slug: string }[] },
  viewerWorkspaceId?: string | null,
  limit = 4,
): Promise<ArtistCard[]> {
  const slugs = artist.categories.map((c) => c.slug);
  if (!slugs.length) return [];
  const sharedCategories = sql<number>`(
    select count(*) from ${artistCategories}
    where ${artistCategories.artistId} = ${artistProfiles.id}
      and ${inArray(artistCategories.categorySlug, slugs)}
  )`;
  const price = startingPriceIn();

  const rows = await db
    .select(cardFields(price))
    .from(artistProfiles)
    .innerJoin(users, eq(users.id, artistProfiles.userId))
    .where(
      and(
        visibleArtists(viewerWorkspaceId),
        ne(artistProfiles.id, artist.id),
        // Never suggest the visitor's private demo artist as a "similar" pick.
        isNull(users.demoWorkspaceId),
        sql`${price} is not null`,
      ),
    )
    .orderBy(sql`${sharedCategories} desc`, sql`${rankScore} desc`)
    .limit(limit);

  return (await withNextAvailable(rows)).rows;
}

// ---------------------------------------------------------------------------
// Categories & favorites

export async function getCategory(slug: string) {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return category ?? null;
}

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getFavoriteArtistIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const rows = await db
    .select({ artistId: favorites.artistId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  return new Set(rows.map((r) => r.artistId));
}

export async function getFavoriteArtists(userId: string, viewerWorkspaceId?: string | null) {
  const price = startingPriceIn();
  const rows = await db
    .select(cardFields(price))
    .from(favorites)
    .innerJoin(artistProfiles, eq(artistProfiles.id, favorites.artistId))
    .innerJoin(users, eq(users.id, artistProfiles.userId))
    .where(and(eq(favorites.userId, userId), visibleArtists(viewerWorkspaceId), sql`${price} is not null`))
    .orderBy(desc(favorites.createdAt));
  return (await withNextAvailable(rows)).rows;
}
