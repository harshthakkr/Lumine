"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createBookingRequest, loadCheckout } from "@/lib/booking-request";

const schema = z
  .object({
    slug: z.string().min(1),
    serviceId: z.uuid(),
    start: z.iso.datetime(),
    location: z.enum(["studio", "client"]),
    address: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.location === "studio" || (v.address && v.address.length >= 8), {
    path: ["address"],
    message: "Add the full address, including apartment or room number",
  });

export type BookState = {
  error?: string;
  fieldErrors?: Partial<Record<"address" | "notes" | "location", string>>;
  slotTaken?: boolean;
} | null;

export async function submitBooking(_prev: BookState, formData: FormData): Promise<BookState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again to finish booking." };
  if (session.user.role !== "client") return { error: "Switch to a client account to book an artist." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    return {
      fieldErrors: { address: fields.address?.[0], notes: fields.notes?.[0], location: fields.location?.[0] },
    };
  }
  const input = parsed.data;

  const checkout = await loadCheckout(input.slug, input.serviceId, session.user.demoWorkspaceId);
  if (!checkout) return { error: "This service is no longer available." };
  if (checkout.artist.userId === session.user.id) return { error: "You can’t book yourself." };

  const result = await createBookingRequest({
    client: { id: session.user.id, demoWorkspaceId: session.user.demoWorkspaceId },
    checkout,
    start: new Date(input.start),
    location: input.location,
    address: input.address || null,
    notes: input.notes || null,
  });

  if (!result.ok) {
    switch (result.code) {
      case "slot_taken":
        return { slotTaken: true, error: "Someone just booked this time. Please pick another one." };
      case "limit":
        return { error: "You have the maximum number of upcoming bookings. Cancel one or wait until after your next appointment." };
      case "location":
        return { fieldErrors: { location: "This artist doesn’t offer that option." } };
    }
  }

  redirect(`${routes.booking(result.reference)}?new=1` as Route);
}
