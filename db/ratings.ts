import { inArray, sql } from "drizzle-orm";
import type { Database, Transaction } from "./client";
import { artistProfiles } from "./schema";

/** Recompute denormalized rating stats from the reviews table. */
export async function refreshArtistRatings(db: Database | Transaction, artistIds?: string[]) {
  await db
    .update(artistProfiles)
    .set({
      reviewCount: sql`(select count(*) from reviews r where r.artist_id = ${artistProfiles.id})`,
      ratingAvg: sql`(select round(avg(r.rating)::numeric, 2) from reviews r where r.artist_id = ${artistProfiles.id})`,
    })
    .where(artistIds ? inArray(artistProfiles.id, artistIds) : undefined);
}
