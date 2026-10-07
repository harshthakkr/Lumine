import { sql } from "drizzle-orm";
import { createDb } from "@/db/client";
import { ARTISTS } from "@/db/fixtures/artists";
import { CATEGORIES } from "@/db/fixtures/categories";
import { buildArtistRows, createRng, generateHistory } from "@/db/fixtures/generate";
import { FIRST_NAMES, LAST_NAMES } from "@/db/fixtures/people";
import { refreshArtistRatings } from "@/db/ratings";
import * as schema from "@/db/schema";
import { requireLocalOrConfirmed } from "./guard";

const SEED = 20261007;
const CLIENT_COUNT = 180;
const PAST_DAYS = 270;
const FUTURE_DAYS = 60;

const url = requireLocalOrConfirmed(process.env.DATABASE_URL, "seed (and wipe)");
const { db, pool } = createDb(url, { max: 1 });

const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function insertInChunks<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  size = 500,
) {
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size) as never);
  }
}

async function main() {
  const started = performance.now();
  const rng = createRng(SEED);
  const now = new Date();

  console.log("Clearing existing data…");
  await db.execute(sql`
    truncate table reviews, bookings, time_off, availability_rules, portfolio_images,
      services, artist_categories, artist_profiles, categories,
      verifications, accounts, sessions, users, demo_workspaces
    cascade
  `);

  await db.insert(schema.categories).values(
    CATEGORIES.map((c, i) => ({ ...c, highlights: [...c.highlights], sortOrder: i })),
  );

  // Clients: unique first/last combinations.
  const clients: { id: string; name: string; email: string }[] = [];
  const seenNames = new Set<string>();
  while (clients.length < CLIENT_COUNT) {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    const [first, last] = name.split(" ");
    clients.push({
      id: crypto.randomUUID(),
      name,
      email: `${ascii(first)}.${ascii(last)}${rng.int(1, 99)}@example.com`,
    });
  }
  // Spread sign-up dates over the last year.
  await insertInChunks(
    schema.users,
    clients.map((c) => {
      const createdAt = new Date(now.getTime() - rng.int(PAST_DAYS + 10, 400) * 86_400_000);
      return { ...c, role: "client" as const, emailVerified: true, createdAt, updatedAt: createdAt };
    }),
  );

  const photoUsage = new Map<string, number>();
  let bookingTotal = 0;
  let reviewTotal = 0;

  for (const fixture of ARTISTS) {
    const userId = crypto.randomUUID();
    const artistId = crypto.randomUUID();
    const joined = new Date(now.getTime() - (PAST_DAYS + rng.int(15, 90)) * 86_400_000);

    await db.insert(schema.users).values({
      id: userId,
      name: fixture.name,
      email: `${fixture.slug}@example.com`,
      emailVerified: true,
      role: "artist",
      image: fixture.avatar,
      createdAt: joined,
      updatedAt: joined,
    });

    const rows = buildArtistRows(fixture, { artistId, userId }, { rng, usage: photoUsage });
    await db.insert(schema.artistProfiles).values({ ...rows.profile, createdAt: joined });
    await db.insert(schema.artistCategories).values(rows.categoryRows);
    await db.insert(schema.services).values(rows.serviceRows);
    await db.insert(schema.availabilityRules).values(rows.availabilityRows);
    await db.insert(schema.portfolioImages).values(rows.portfolioRows);

    const history = generateHistory({
      rng,
      fixture,
      artistId,
      services: rows.serviceRows,
      availability: rows.availabilityRows,
      clients,
      now,
      pastDays: PAST_DAYS,
      futureDays: FUTURE_DAYS,
    });
    await insertInChunks(schema.bookings, history.bookings);
    await insertInChunks(schema.reviews, history.reviews);
    bookingTotal += history.bookings.length;
    reviewTotal += history.reviews.length;
  }

  await refreshArtistRatings(db);

  const summary = await db.execute<{
    display_name: string;
    rating_avg: string;
    review_count: number;
    upcoming: number;
  }>(sql`
    select a.display_name, a.rating_avg, a.review_count,
      (select count(*)::int from bookings b where b.artist_id = a.id and b.starts_at > now()
         and b.status in ('confirmed','requested')) as upcoming
    from artist_profiles a order by a.rating_avg desc nulls last
  `);
  console.table(summary.rows);
  console.log(
    `Seeded ${CATEGORIES.length} categories, ${ARTISTS.length} artists, ${clients.length} clients, ` +
      `${bookingTotal} bookings, ${reviewTotal} reviews in ${Math.round(performance.now() - started)}ms`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
