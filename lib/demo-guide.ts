import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { artistProfiles, bookings, favorites, users } from "@/db/schema";
import { db } from "./db";

export type GuideStepId = "save" | "request" | "accept";
export type DemoGuide = {
  clientName: string;
  artistName: string;
  artistSlug: string;
  steps: Record<GuideStepId, boolean>;
  /** The booking created in step 2, once it exists. */
  bookingReference: string | null;
};

/**
 * Progress through the demo storyline, derived from what the visitor has
 * actually done in their workspace (nothing is self-reported).
 */
export async function getDemoGuide(workspaceId: string): Promise<DemoGuide | null> {
  const members = await db
    .select({ id: users.id, name: users.name, role: users.role, artistId: artistProfiles.id, slug: artistProfiles.slug })
    .from(users)
    .leftJoin(artistProfiles, eq(artistProfiles.userId, users.id))
    .where(eq(users.demoWorkspaceId, workspaceId));
  const client = members.find((m) => m.role === "client");
  const artist = members.find((m) => m.role === "artist");
  if (!client || !artist?.artistId || !artist.slug) return null;

  const [[saved], ownBookings] = await Promise.all([
    db.select({ userId: favorites.userId }).from(favorites).where(eq(favorites.userId, client.id)).limit(1),
    db
      .select({ reference: bookings.reference, status: bookings.status })
      .from(bookings)
      .where(
        and(
          eq(bookings.clientId, client.id),
          eq(bookings.artistId, artist.artistId),
          inArray(bookings.status, ["requested", "confirmed", "completed"]),
        ),
      ),
  ]);

  const accepted = ownBookings.find((b) => b.status !== "requested");
  return {
    clientName: client.name,
    artistName: artist.name,
    artistSlug: artist.slug,
    steps: { save: !!saved, request: ownBookings.length > 0, accept: !!accepted },
    bookingReference: (accepted ?? ownBookings[0])?.reference ?? null,
  };
}
