import "server-only";
import { randomInt } from "node:crypto";
import { and, count, eq, gt, inArray, lt } from "drizzle-orm";
import { ACTIVE_BOOKING_STATUSES, artistProfiles, bookings, services, users } from "@/db/schema";
import { isSlotAvailable } from "@/lib/availability";
import { db } from "@/lib/db";
import { loadAvailabilityContexts } from "@/lib/queries/availability";
import { visibleArtists } from "@/lib/queries/artists";

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const MAX_UPCOMING = { demo: 5, real: 10 };

function newReference() {
  let ref = "LUM-";
  for (let i = 0; i < 6; i++) ref += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return ref;
}

/** Postgres error code, looking through Drizzle's wrapper. */
function pgCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? pgCode(error.cause) : undefined;
}

export type BookingCheckout = NonNullable<Awaited<ReturnType<typeof loadCheckout>>>;

/** Artist + service for a checkout page, respecting demo visibility. */
export async function loadCheckout(slug: string, serviceId: string, viewerWorkspaceId?: string | null) {
  const [row] = await db
    .select({ artist: artistProfiles, service: services })
    .from(artistProfiles)
    .innerJoin(users, eq(users.id, artistProfiles.userId))
    .innerJoin(services, and(eq(services.artistId, artistProfiles.id), eq(services.id, serviceId)))
    .where(and(eq(artistProfiles.slug, slug), visibleArtists(viewerWorkspaceId), eq(services.isActive, true)))
    .limit(1);
  return row ?? null;
}

export async function isStartBookable(artistId: string, durationMinutes: number, start: Date) {
  const context = (await loadAvailabilityContexts([artistId])).get(artistId);
  return context ? isSlotAvailable({ ...context, durationMinutes }, start) : false;
}

export type CreateBookingInput = {
  client: { id: string; demoWorkspaceId?: string | null };
  checkout: BookingCheckout;
  start: Date;
  location: "studio" | "client";
  address: string | null;
  notes: string | null;
};

export type CreateBookingResult =
  | { ok: true; reference: string; status: "requested" | "confirmed" }
  | { ok: false; code: "slot_taken" | "limit" | "location" };

export async function createBookingRequest(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { artist, service } = input.checkout;

  if (input.location === "studio" ? !artist.offersStudio : !artist.travelsToClient) {
    return { ok: false, code: "location" };
  }
  // Re-check against working hours, lead time and the booking window. The
  // exclusion constraint below is the final word on overlaps.
  if (!(await isStartBookable(artist.id, service.durationMinutes, input.start))) {
    return { ok: false, code: "slot_taken" };
  }

  const [{ upcoming }] = await db
    .select({ upcoming: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.clientId, input.client.id),
        inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
        gt(bookings.startsAt, new Date()),
      ),
    );
  if (upcoming >= (input.client.demoWorkspaceId ? MAX_UPCOMING.demo : MAX_UPCOMING.real)) {
    return { ok: false, code: "limit" };
  }

  const status = artist.instantBook ? "confirmed" : "requested";
  const end = new Date(input.start.getTime() + service.durationMinutes * 60_000);

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newReference();
    try {
      await db.transaction(async (tx) => {
        // Lapsed payment holds must not block the constraint.
        await tx
          .update(bookings)
          .set({ status: "expired" })
          .where(
            and(
              eq(bookings.artistId, artist.id),
              eq(bookings.status, "awaiting_payment"),
              lt(bookings.holdExpiresAt, new Date()),
            ),
          );
        await tx.insert(bookings).values({
          reference,
          clientId: input.client.id,
          artistId: artist.id,
          serviceId: service.id,
          status,
          startsAt: input.start,
          endsAt: end,
          serviceName: service.name,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
          location: input.location,
          address: input.location === "client" ? input.address : null,
          notes: input.notes,
        });
      });
      return { ok: true, reference, status };
    } catch (error) {
      const code = pgCode(error);
      if (code === "23P01") return { ok: false, code: "slot_taken" }; // someone else got there first
      if (code === "23505") continue; // reference collision; try a new one
      throw error;
    }
  }
  throw new Error("Could not allocate a unique booking reference");
}
