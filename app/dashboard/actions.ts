"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getArtistProfileForUser, respondToRequest } from "@/lib/queries/bookings";

const input = z.object({
  bookingId: z.uuid(),
  decision: z.enum(["accept", "decline"]),
});

export type RespondState = { ok: true; decision: "accept" | "decline" } | { ok: false; error: string } | null;

export async function respondToBookingRequest(
  _prev: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const session = await getSession();
  if (session?.user.role !== "artist") return { ok: false, error: "Only artists can respond to requests." };
  const profile = await getArtistProfileForUser(session.user.id);
  if (!profile) return { ok: false, error: "Artist profile not found." };

  const updated = await respondToRequest(profile.id, parsed.data.bookingId, parsed.data.decision);
  if (!updated) return { ok: false, error: "This request was already handled." };

  revalidatePath("/dashboard");
  revalidatePath("/bookings", "layout");
  return { ok: true, decision: parsed.data.decision };
}
