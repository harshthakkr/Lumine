import "server-only";
import { createHmac } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { ARTISTS, DEMO_ARTIST } from "@/db/fixtures/artists";
import {
  bookingReference,
  buildArtistRows,
  createRng,
  findSlot,
  generateHistory,
  seedFrom,
  type Interval,
} from "@/db/fixtures/generate";
import { refreshArtistRatings } from "@/db/ratings";
import * as schema from "@/db/schema";
import { addDays, toLocalDate } from "@/lib/time";
import { db } from "./db";
import { env } from "./env";

export type DemoRole = "client" | "artist";

const WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_WORKSPACES_PER_IP_PER_HOUR = 10;

export const DEMO_CLIENT_NAME = "Maya Ellis";
const DEMO_EMAIL_DOMAIN = "demo.example.com";

/**
 * Demo accounts have no password anyone knows: it's derived from the
 * server secret, so the server can sign into either half of a workspace.
 */
export function demoPassword(userId: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`demo-password:${userId}`).digest("base64url");
}

export function hashIp(ip: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`ip:${ip}`).digest("base64url").slice(0, 32);
}

export class DemoRateLimitError extends Error {}

export async function isDemoRateLimited(ipHash: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.demoWorkspaces)
    .where(
      and(
        eq(schema.demoWorkspaces.ipHash, ipHash),
        gt(schema.demoWorkspaces.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );
  return count >= MAX_WORKSPACES_PER_IP_PER_HOUR;
}

/** Deletes expired workspaces; everything inside cascades. */
export async function deleteExpiredWorkspaces(limit = 200) {
  const expired = await db
    .select({ id: schema.demoWorkspaces.id })
    .from(schema.demoWorkspaces)
    .where(lt(schema.demoWorkspaces.expiresAt, new Date()))
    .limit(limit);
  if (!expired.length) return 0;
  await db.delete(schema.demoWorkspaces).where(
    inArray(
      schema.demoWorkspaces.id,
      expired.map((w) => w.id),
    ),
  );
  return expired.length;
}

export type ProvisionedWorkspace = {
  workspaceId: string;
  client: { id: string; email: string };
  artist: { id: string; email: string };
};

/**
 * Creates a workspace with a ready-to-explore client and artist:
 * the artist has months of history, a full calendar and requests to
 * answer; the client has past and upcoming bookings with real artists.
 */
export async function provisionDemoWorkspace(ipHash: string | null): Promise<ProvisionedWorkspace> {
  const now = new Date();
  const workspaceId = crypto.randomUUID();
  const rng = createRng(seedFrom(workspaceId));
  const shortId = workspaceId.slice(0, 8);

  const client = {
    id: crypto.randomUUID(),
    name: DEMO_CLIENT_NAME,
    email: `client-${shortId}@${DEMO_EMAIL_DOMAIN}`,
  };
  const artistUser = {
    id: crypto.randomUUID(),
    name: DEMO_ARTIST.name,
    email: `artist-${shortId}@${DEMO_EMAIL_DOMAIN}`,
  };
  const artistId = crypto.randomUUID();

  const [clientHash, artistHash] = await Promise.all([
    hashPassword(demoPassword(client.id)),
    hashPassword(demoPassword(artistUser.id)),
  ]);

  await db.transaction(async (tx) => {
    await tx.insert(schema.demoWorkspaces).values({
      id: workspaceId,
      ipHash,
      expiresAt: new Date(now.getTime() + WORKSPACE_TTL_MS),
    });

    await tx.insert(schema.users).values([
      { ...client, role: "client", emailVerified: true, demoWorkspaceId: workspaceId },
      {
        ...artistUser,
        role: "artist",
        emailVerified: true,
        image: DEMO_ARTIST.avatar,
        demoWorkspaceId: workspaceId,
      },
    ]);
    await tx.insert(schema.accounts).values([
      {
        id: crypto.randomUUID(),
        accountId: client.id,
        providerId: "credential",
        userId: client.id,
        password: clientHash,
      },
      {
        id: crypto.randomUUID(),
        accountId: artistUser.id,
        providerId: "credential",
        userId: artistUser.id,
        password: artistHash,
      },
    ]);

    // --- The visitor's artist persona -------------------------------------
    const rows = buildArtistRows(
      DEMO_ARTIST,
      { artistId, userId: artistUser.id, slug: `${DEMO_ARTIST.slug}-${shortId}` },
      { rng, usage: new Map() },
    );
    await tx.insert(schema.artistProfiles).values(rows.profile);
    await tx.insert(schema.artistCategories).values(rows.categoryRows);
    await tx.insert(schema.services).values(rows.serviceRows);
    await tx.insert(schema.availabilityRules).values(rows.availabilityRows);
    await tx.insert(schema.portfolioImages).values(rows.portfolioRows);

    const seededClients = await tx
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(and(eq(schema.users.role, "client"), isNull(schema.users.demoWorkspaceId)))
      .orderBy(sql`random()`)
      .limit(60);

    const history = generateHistory({
      rng,
      fixture: DEMO_ARTIST,
      artistId,
      services: rows.serviceRows,
      availability: rows.availabilityRows,
      clients: seededClients,
      now,
      pastDays: 150,
      futureDays: 35,
      futureFill: 0.5,
    });

    // Guarantee a few requests in the inbox, since answering them is the
    // most interesting thing an artist can do in the demo.
    // Exactly a few requests in the inbox: enough to act on, not a wall.
    for (const extra of history.bookings.filter((b) => b.status === "requested").slice(3)) {
      extra.status = "confirmed";
    }
    const upcoming = history.bookings
      .filter((b) => b.startsAt > now && b.status === "confirmed")
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    let requested = history.bookings.filter((b) => b.status === "requested").length;
    for (const booking of upcoming.slice(2)) {
      if (requested >= 3) break;
      if (rng.chance(0.5)) {
        booking.status = "requested";
        booking.createdAt = booking.updatedAt = new Date(now.getTime() - rng.int(1, 30) * 3_600_000);
        requested++;
      }
    }

    if (history.bookings.length) await tx.insert(schema.bookings).values(history.bookings);
    if (history.reviews.length) await tx.insert(schema.reviews).values(history.reviews);
    await refreshArtistRatings(tx, [artistId]);

    // --- The visitor's client persona: history with real artists ----------
    const publicArtists = await tx
      .select({
        id: schema.artistProfiles.id,
        slug: schema.artistProfiles.slug,
        timezone: schema.artistProfiles.timezone,
      })
      .from(schema.artistProfiles)
      .innerJoin(schema.users, eq(schema.users.id, schema.artistProfiles.userId))
      .where(and(eq(schema.artistProfiles.isPublished, true), isNull(schema.users.demoWorkspaceId)));

    const [pastReviewed, pastUnreviewed, upcomingWith] = rng.shuffle(publicArtists);
    const plan = [
      { artist: pastReviewed, daysFromToday: -rng.int(25, 60), review: true },
      { artist: pastUnreviewed, daysFromToday: -rng.int(3, 9), review: false },
      { artist: upcomingWith, daysFromToday: rng.int(4, 10), review: false },
    ];

    for (const step of plan) {
      if (!step.artist) continue;
      const fixture = ARTISTS.find((a) => a.slug === step.artist.slug);
      const artistServices = await tx
        .select()
        .from(schema.services)
        .where(eq(schema.services.artistId, step.artist.id));
      const rules = await tx
        .select()
        .from(schema.availabilityRules)
        .where(eq(schema.availabilityRules.artistId, step.artist.id));
      if (!fixture || !artistServices.length || !rules.length) continue;

      const service = rng.pick(artistServices);
      const occupied: Interval[] = (
        await tx
          .select({ start: schema.bookings.startsAt, end: schema.bookings.endsAt })
          .from(schema.bookings)
          .where(
            and(
              eq(schema.bookings.artistId, step.artist.id),
              inArray(schema.bookings.status, [...schema.ACTIVE_BOOKING_STATUSES, "completed"]),
            ),
          )
      ).map((b) => ({ start: b.start.getTime(), end: b.end.getTime() }));

      // Walk outward from the target day until the artist has a free slot.
      const today = toLocalDate(now, step.artist.timezone);
      let slot: Interval | null = null;
      for (let i = 0; i < 21 && !slot; i++) {
        const offset = step.daysFromToday + (step.daysFromToday < 0 ? -i : i);
        slot = findSlot(
          rng,
          addDays(today, offset),
          service.durationMinutes,
          rules,
          step.artist.timezone,
          occupied,
        );
      }
      if (!slot) continue;

      const isPast = slot.end < now.getTime();
      const bookingId = crypto.randomUUID();
      const createdAt = new Date(slot.start - rng.int(7, 20) * 86_400_000);
      await tx.insert(schema.bookings).values({
        id: bookingId,
        reference: bookingReference(rng),
        clientId: client.id,
        artistId: step.artist.id,
        serviceId: service.id,
        status: isPast ? "completed" : "confirmed",
        startsAt: new Date(slot.start),
        endsAt: new Date(slot.end),
        serviceName: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        location: fixture.offersStudio ? "studio" : "client",
        address: fixture.offersStudio ? null : "155 Montague St, Brooklyn, NY 11201",
        createdAt: createdAt > now ? now : createdAt,
        updatedAt: createdAt > now ? now : createdAt,
      });

      if (isPast && step.review) {
        await tx.insert(schema.reviews).values({
          bookingId,
          artistId: step.artist.id,
          authorId: client.id,
          rating: 5,
          body: `${fixture.name.split(" ")[0]} was wonderful. Calm, on time and the look lasted all night. Already planning my next booking.`,
          createdAt: new Date(slot.end + 20 * 3_600_000),
        });
        await refreshArtistRatings(tx, [step.artist.id]);
      }
    }
  });

  return {
    workspaceId,
    client: { id: client.id, email: client.email },
    artist: { id: artistUser.id, email: artistUser.email },
  };
}

/** The user on the other side of the visitor's workspace. */
export async function getWorkspaceCounterpart(workspaceId: string, role: DemoRole) {
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(and(eq(schema.users.demoWorkspaceId, workspaceId), eq(schema.users.role, role)))
    .limit(1);
  return user ?? null;
}

export async function deleteWorkspace(workspaceId: string) {
  await db.delete(schema.demoWorkspaces).where(eq(schema.demoWorkspaces.id, workspaceId));
}
