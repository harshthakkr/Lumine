import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RespondButtons } from "@/components/dashboard/RespondButtons";
import { CalendarIcon, CheckIcon, ClockIcon, HomeIcon, ShieldIcon, StudioIcon } from "@/components/icons";
import { Navbar } from "@/components/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { buttonStyles } from "@/components/ui/button";
import { CANCELLATION_WINDOW_HOURS } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { firstName, formatDay, formatDuration, formatPrice, formatRelative, formatTimeRange } from "@/lib/format";
import { getBookingForViewer } from "@/lib/queries/bookings";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Booking", robots: { index: false } };

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ new?: string }>;
};

type Step = { label: string; detail: string; state: "done" | "current" | "upcoming" };

export default async function BookingPage({ params, searchParams }: Props) {
  const [{ reference }, { new: isNew }, session] = await Promise.all([params, searchParams, getSession()]);
  if (!session) redirect(routes.signIn(routes.booking(reference)));

  const row = await getBookingForViewer(reference, session.user.id);
  if (!row) notFound();
  const { booking, artist, clientName } = row;
  const isClient = booking.clientId === session.user.id;
  const tz = artist.timezone;
  const artistFirst = firstName(artist.name);
  const upcoming = booking.endsAt > new Date() && ["requested", "confirmed"].includes(booking.status);
  const justBooked = isNew === "1" && isClient;
  const hours = CANCELLATION_WINDOW_HOURS[artist.cancellationPolicy];

  const steps: Step[] =
    booking.status === "requested"
      ? [
          { label: "Request sent", detail: formatRelative(booking.createdAt), state: "done" },
          { label: isClient ? `${artistFirst} confirms` : "You confirm", detail: "Within 24 hours", state: "current" },
          { label: "Appointment", detail: formatDay(booking.startsAt, tz), state: "upcoming" },
        ]
      : booking.status === "confirmed" && upcoming
        ? [
            { label: "Requested", detail: formatRelative(booking.createdAt), state: "done" },
            { label: "Confirmed", detail: isClient ? `${artistFirst} is expecting you` : "In your calendar", state: "done" },
            { label: "Appointment", detail: formatRelative(booking.startsAt), state: "current" },
          ]
        : [];

  let title: string;
  let subtitle: string;
  if (justBooked) {
    title = booking.status === "confirmed" ? "You’re booked!" : `Request sent to ${artistFirst}`;
    subtitle =
      booking.status === "confirmed"
        ? `${artistFirst} has your appointment in the calendar.`
        : `${artistFirst} will review your request within 24 hours. Your time is held until then.`;
  } else if (!isClient && booking.status === "requested") {
    title = `${firstName(clientName)} would like to book you`;
    subtitle = "Accept to confirm the appointment, or decline to free up the time.";
  } else {
    title = booking.serviceName;
    subtitle = isClient ? `With ${artist.name}` : `For ${clientName}`;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
        <Link href={routes.bookings} className="mb-8 inline-block text-sm text-ink-muted hover:text-neutral-dark">
          ← All bookings
        </Link>

        <header className="mb-10">
          {justBooked && (
            <span className="mb-5 grid size-14 animate-rise place-items-center rounded-full bg-success-soft text-success">
              <CheckIcon className="size-7" />
            </span>
          )}
          <h1 className="font-playfair-display text-4xl">{title}</h1>
          <p className="mt-2 text-ink-muted">{subtitle}</p>
          {!isClient && booking.status === "requested" && upcoming && (
            <div className="mt-6">
              <RespondButtons bookingId={booking.id} size="md" />
            </div>
          )}
        </header>

        {steps.length > 0 && (
          <ol className="mb-10 grid grid-cols-3 gap-2" aria-label="Booking progress">
            {steps.map((step) => (
              <li key={step.label} className="flex flex-col gap-2">
                <span
                  className={`h-1 rounded-full ${
                    step.state === "done" ? "bg-success" : step.state === "current" ? "bg-primary" : "bg-line"
                  }`}
                />
                <span className={`text-sm font-medium ${step.state === "upcoming" ? "text-ink-muted" : ""}`}>{step.label}</span>
                <span className="text-xs text-ink-muted">{step.detail}</span>
              </li>
            ))}
          </ol>
        )}

        <section className="overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="flex items-center gap-4 border-b border-line p-6">
            {isClient ? (
              <Image src={artist.avatarUrl} alt="" width={56} height={56} sizes="112px" className="size-14 rounded-full object-cover object-top" />
            ) : (
              <Avatar name={clientName} size={56} />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-playfair-display text-xl">{booking.serviceName}</p>
              {isClient ? (
                <Link href={routes.artist(artist.slug)} className="text-sm text-ink-muted hover:underline">
                  {artist.name}
                </Link>
              ) : (
                <p className="text-sm text-ink-muted">{clientName}</p>
              )}
            </div>
            <StatusPill status={booking.status} viewer={isClient ? "client" : "artist"} />
          </div>
          <dl className="grid gap-5 p-6 sm:grid-cols-2">
            <Detail icon={<CalendarIcon className="size-5" />} label="When">
              {formatDay(booking.startsAt, tz)}
              <br />
              {formatTimeRange(booking.startsAt, booking.endsAt, tz)} · {formatDuration(booking.durationMinutes)}
            </Detail>
            <Detail
              icon={booking.location === "studio" ? <StudioIcon className="size-5" /> : <HomeIcon className="size-5" />}
              label="Where"
            >
              {booking.location === "studio"
                ? isClient
                  ? `${artistFirst}’s studio, ${artist.neighborhood}${booking.status === "confirmed" ? "" : " (address shared once confirmed)"}`
                  : "Your studio"
                : booking.address}
            </Detail>
            <Detail icon={<ClockIcon className="size-5" />} label="Reference">
              <span className="font-mono tracking-wider">{booking.reference}</span>
            </Detail>
            <Detail icon={<ShieldIcon className="size-5" />} label="Cancellation">
              Free until {hours >= 48 ? `${hours / 24} days` : `${hours} hours`} before
            </Detail>
          </dl>
          {booking.notes && (
            <div className="border-t border-line px-6 py-5">
              <p className="mb-1 text-xs font-medium tracking-widest text-ink-muted uppercase">
                {isClient ? `Your notes for ${artistFirst}` : `Notes from ${firstName(clientName)}`}
              </p>
              <p className="text-sm text-neutral-dark/85">{booking.notes}</p>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-line bg-secondary/20 px-6 py-4">
            <span className="text-sm">Total</span>
            <span className="font-playfair-display text-2xl">{formatPrice(booking.priceCents)}</span>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          {upcoming && (
            <a href={routes.bookingCalendar(booking.reference)} className={buttonStyles()} download>
              <CalendarIcon className="size-4" /> Add to calendar
            </a>
          )}
          {isClient && (
            <Link href={routes.artist(artist.slug)} className={buttonStyles({ variant: "secondary" })}>
              View {artistFirst}&rsquo;s profile
            </Link>
          )}
        </div>
      </main>
    </>
  );
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <dt className="text-xs font-medium tracking-widest text-ink-muted uppercase">{label}</dt>
        <dd className="mt-1 text-sm">{children}</dd>
      </div>
    </div>
  );
}
