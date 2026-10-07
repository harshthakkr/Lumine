"use client";

import Link from "next/link";
import { formatDay, formatDuration, formatPrice, formatTimeRange } from "@/lib/format";
import { BoltIcon, CalendarIcon, ShieldIcon } from "../icons";
import { buttonStyles } from "../ui/button";
import { useBooking } from "./BookingContext";

function useCheckout() {
  const { artist, service, slot } = useBooking();
  const start = slot ? new Date(slot) : null;
  const end = start ? new Date(start.getTime() + service.durationMinutes * 60_000) : null;
  const href = slot
    ? (`/book/${artist.slug}?service=${service.id}&start=${encodeURIComponent(slot)}` as `/book/${string}`)
    : null;
  const cta = artist.instantBook ? "Book now" : "Request to book";
  return { start, end, href, cta };
}

const scrollToTimes = () =>
  document.getElementById("availability")?.scrollIntoView({ behavior: "smooth", block: "start" });

export function BookingCard({ policyNote, preview }: { policyNote: string; preview?: boolean }) {
  const { artist, service } = useBooking();
  const { start, end, href, cta } = useCheckout();

  return (
    <aside aria-label="Booking summary" className="rounded-3xl border border-line bg-surface p-6 shadow-xl shadow-neutral-dark/5">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <p>
          <span className="font-playfair-display text-3xl">{formatPrice(service.priceCents)}</span>
          <span className="ml-2 text-sm text-ink-muted">· {formatDuration(service.durationMinutes)}</span>
        </p>
        {artist.instantBook && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <BoltIcon className="size-3 text-primary" /> Instant
          </span>
        )}
      </div>

      <dl className="mb-5 overflow-hidden rounded-2xl border border-line text-sm">
        <div className="border-b border-line px-4 py-3">
          <dt className="text-[11px] font-medium tracking-widest text-ink-muted uppercase">Service</dt>
          <dd className="mt-0.5 truncate">{service.name}</dd>
        </div>
        <button type="button" onClick={scrollToTimes} className="block w-full px-4 py-3 text-left hover:bg-secondary/30">
          <dt className="text-[11px] font-medium tracking-widest text-ink-muted uppercase">Date & time</dt>
          <dd className="mt-0.5">
            {start && end ? (
              `${formatDay(start, artist.timezone)} · ${formatTimeRange(start, end, artist.timezone)}`
            ) : (
              <span className="text-ink-muted">Choose a time</span>
            )}
          </dd>
        </button>
      </dl>

      {preview ? (
        <p className="rounded-xl bg-secondary/40 px-4 py-3 text-center text-sm text-ink-muted">
          Clients pick a time and book from here.
        </p>
      ) : href ? (
        <Link href={href} className={buttonStyles({ size: "lg", className: "w-full" })}>
          {cta}
        </Link>
      ) : (
        <button type="button" onClick={scrollToTimes} className={buttonStyles({ size: "lg", className: "w-full" })}>
          <CalendarIcon className="size-4" /> Check availability
        </button>
      )}

      <p className="mt-4 text-center text-xs text-ink-muted">
        {artist.instantBook
          ? "Confirmed instantly. No payment taken yet."
          : `${artist.name.split(" ")[0]} confirms within 24 hours. No payment taken yet.`}
      </p>
      <p className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-xs text-ink-muted">
        <ShieldIcon className="mt-0.5 size-4 shrink-0 text-success" />
        {policyNote}
      </p>
    </aside>
  );
}

export function MobileBookingBar() {
  const { artist, service } = useBooking();
  const { start, href, cta } = useCheckout();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-neutral-light/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm">
            <span className="font-semibold">{formatPrice(service.priceCents)}</span>
            <span className="text-ink-muted"> · {service.name}</span>
          </p>
          <p className="truncate text-xs text-ink-muted">
            {start ? `${formatDay(start, artist.timezone)}, ${new Intl.DateTimeFormat("en-US", { timeZone: artist.timezone, hour: "numeric", minute: "2-digit" }).format(start)}` : "No time selected"}
          </p>
        </div>
        {href ? (
          <Link href={href} className={buttonStyles({ className: "shrink-0" })}>
            {cta}
          </Link>
        ) : (
          <button type="button" onClick={scrollToTimes} className={buttonStyles({ className: "shrink-0" })}>
            Choose a time
          </button>
        )}
      </div>
    </div>
  );
}
