"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitBooking, type BookState } from "@/app/book/[slug]/actions";
import { HomeIcon, StudioIcon } from "../icons";
import { buttonStyles } from "../ui/button";

export function BookingForm({
  slug,
  serviceId,
  start,
  offersStudio,
  travelsToClient,
  neighborhood,
  firstName,
  cta,
  children,
}: {
  slug: string;
  serviceId: string;
  start: string;
  offersStudio: boolean;
  travelsToClient: boolean;
  neighborhood: string;
  firstName: string;
  cta: string;
  /** Order summary, rendered beside (desktop) or above (mobile) the form. */
  children: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<BookState, FormData>(submitBooking, null);
  const [location, setLocation] = useState<"studio" | "client">(offersStudio ? "studio" : "client");
  // Controlled so values survive a failed submit (React resets uncontrolled fields after an action).
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const options = [
    offersStudio && {
      value: "studio" as const,
      icon: <StudioIcon className="size-5" />,
      title: `${firstName}’s studio`,
      body: `Private studio in ${neighborhood}. Address shared once confirmed.`,
    },
    travelsToClient && {
      value: "client" as const,
      icon: <HomeIcon className="size-5" />,
      title: "My place",
      body: `${firstName} comes to your home, hotel or venue.`,
    },
  ].filter(Boolean) as { value: "studio" | "client"; icon: React.ReactNode; title: string; body: string }[];

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="location" value={location} />

      <div className="order-2 flex flex-col gap-10 lg:order-1">
        {state?.error && (
          <div role="alert" className="rounded-2xl bg-danger-soft px-5 py-4 text-sm text-danger">
            <p>{state.error}</p>
            {state.slotTaken && (
              <Link href={`/artists/${slug}?service=${serviceId}#availability` as `/artists/${string}`} className="mt-2 inline-block font-medium underline underline-offset-4">
                Choose another time
              </Link>
            )}
          </div>
        )}

        <fieldset>
          <legend className="mb-1 font-playfair-display text-2xl">Where should we meet?</legend>
          <p className="mb-4 text-sm text-ink-muted">
            {options.length > 1 ? "Choose what suits you." : `${firstName} only offers this option.`}
          </p>
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const selected = o.value === location;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLocation(o.value)}
                  className={`flex gap-4 rounded-2xl border p-5 text-left transition-[border-color,box-shadow] ${
                    selected
                      ? "border-neutral-dark shadow-[0_0_0_1px_var(--color-neutral-dark)]"
                      : "border-line hover:border-neutral-dark/40"
                  }`}
                >
                  <span className={selected ? "text-primary" : "text-ink-muted"}>{o.icon}</span>
                  <span>
                    <span className="block font-medium">{o.title}</span>
                    <span className="mt-1 block text-sm text-ink-muted">{o.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {state?.fieldErrors?.location && <p className="mt-2 text-sm text-danger">{state.fieldErrors.location}</p>}

          {location === "client" && (
            <div className="mt-5 animate-rise">
              <label htmlFor="address" className="mb-2 block text-sm font-medium">
                Address
              </label>
              <input
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
                placeholder="Street, apartment or room, city, ZIP"
                aria-invalid={!!state?.fieldErrors?.address}
                aria-describedby="address-hint"
                className="h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus:border-neutral-dark/60 aria-invalid:border-danger"
              />
              <p id="address-hint" className={`mt-2 text-xs ${state?.fieldErrors?.address ? "text-danger" : "text-ink-muted"}`}>
                {state?.fieldErrors?.address ?? "Only shared with your artist."}
              </p>
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor="notes" className="mb-1 block font-playfair-display text-2xl">
            Anything {firstName} should know?
          </label>
          <p className="mb-4 text-sm text-ink-muted">Skin type, allergies, outfit colours, the look you&rsquo;re going for. Optional.</p>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Outfit is emerald green, I have sensitive skin, photos start at 2pm."
            className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-neutral-dark/60"
          />
          <p className="mt-1 text-right text-xs tabular-nums text-ink-muted">{notes.length}/500</p>
        </div>

        <div className="border-t border-line pt-8">
          <button type="submit" disabled={pending} className={buttonStyles({ size: "lg", className: "w-full sm:w-auto sm:px-10" })}>
            {pending ? (
              <>
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Booking…
              </>
            ) : (
              cta
            )}
          </button>
          <p className="mt-3 text-xs text-ink-muted">
            By continuing you agree to the artist&rsquo;s cancellation policy. You won&rsquo;t be charged today.
          </p>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-28">{children}</div>
      </div>
    </form>
  );
}
