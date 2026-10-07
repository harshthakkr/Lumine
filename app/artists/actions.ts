"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { artistProfiles, favorites, services, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getArtistReviews, visibleArtists } from "@/lib/queries/artists";
import { getServiceAvailability } from "@/lib/queries/availability";

export type FavoriteResult = { ok: true; saved: boolean } | { ok: false; reason: "auth" | "invalid" };

export async function setFavorite(artistId: string, saved: boolean): Promise<FavoriteResult> {
  if (!z.uuid().safeParse(artistId).success) return { ok: false, reason: "invalid" };
  const session = await getSession();
  if (!session) return { ok: false, reason: "auth" };

  if (saved) {
    // Only artists the viewer can actually see may be saved.
    const [visible] = await db
      .select({ id: artistProfiles.id })
      .from(artistProfiles)
      .innerJoin(users, eq(users.id, artistProfiles.userId))
      .where(and(eq(artistProfiles.id, artistId), visibleArtists(session.user.demoWorkspaceId)))
      .limit(1);
    if (!visible) return { ok: false, reason: "invalid" };
    await db.insert(favorites).values({ userId: session.user.id, artistId }).onConflictDoNothing();
  } else {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, session.user.id), eq(favorites.artistId, artistId)));
  }
  revalidatePath("/saved");
  return { ok: true, saved };
}

const reviewQuery = z.object({
  artistId: z.uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  cursor: z.uuid().optional(),
});

export async function loadReviews(input: z.input<typeof reviewQuery>) {
  const parsed = reviewQuery.parse(input);
  return getArtistReviews(parsed.artistId, { rating: parsed.rating, cursor: parsed.cursor });
}

const slotQuery = z.object({
  artistId: z.uuid(),
  serviceId: z.uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.number().int().min(1).max(31).default(14),
  seek: z.boolean().optional(),
});

/** Bookable start times for one service. Duration comes from the DB, never the client. */
export async function loadSlots(input: z.input<typeof slotQuery>) {
  const { artistId, serviceId, from, days, seek } = slotQuery.parse(input);
  const [service] = await db
    .select({ duration: services.durationMinutes })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.artistId, artistId), eq(services.isActive, true)))
    .limit(1);
  if (!service) return null;
  return getServiceAvailability(artistId, service.duration, from ?? null, days, { seek });
}
