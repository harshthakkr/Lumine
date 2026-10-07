import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingForm } from "@/components/checkout/BookingForm";
import { ShieldIcon } from "@/components/icons";
import { Navbar } from "@/components/Navbar";
import { buttonStyles } from "@/components/ui/button";
import { CANCELLATION_WINDOW_HOURS } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isStartBookable, loadCheckout } from "@/lib/booking-request";
import { formatDay, formatDuration, formatPrice, formatTimeRange } from "@/lib/format";

export const metadata: Metadata = { title: "Review your booking", robots: { index: false } };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; start?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const [{ slug }, { service, start }] = await Promise.all([params, searchParams]);
  const startDate = start ? new Date(start) : null;
  if (!service || !startDate || Number.isNaN(startDate.getTime())) notFound();

  const session = await getSession();
  if (!session) {
    const back = `/book/${slug}?service=${service}&start=${encodeURIComponent(start!)}`;
    redirect(`/sign-in?next=${encodeURIComponent(back)}`);
  }

  const checkout = await loadCheckout(slug, service, session.user.demoWorkspaceId);
  if (!checkout) notFound();
  const { artist, service: svc } = checkout;
  const profileHref = `/artists/${artist.slug}?service=${svc.id}#availability` as `/artists/${string}`;

  if (session.user.role !== "client") {
    return (
      <Notice
        title="Booking is for client accounts"
        body={
          session.user.demoWorkspaceId
            ? "You’re exploring as an artist. Use “Switch to client view” in the demo bar to book this appointment."
            : "Artist accounts can’t book other artists yet."
        }
        href={profileHref}
      />
    );
  }

  if (!(await isStartBookable(artist.id, svc.durationMinutes, startDate))) {
    return (
      <Notice
        title="That time was just taken"
        body={`${artist.displayName.split(" ")[0]}’s calendar changed since you picked it. Choose another time and you’re almost there.`}
        href={profileHref}
        cta="See open times"
      />
    );
  }

  const end = new Date(startDate.getTime() + svc.durationMinutes * 60_000);
  const tz = artist.timezone;
  const hours = CANCELLATION_WINDOW_HOURS[artist.cancellationPolicy];
  const firstName = artist.displayName.split(" ")[0];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <Link href={profileHref} className="mb-6 inline-block text-sm text-ink-muted hover:text-neutral-dark">
          ← Back to {firstName}
        </Link>
        <h1 className="mb-10 font-playfair-display text-4xl">
          {artist.instantBook ? "Confirm your booking" : "Request your booking"}
        </h1>
        <BookingForm
          slug={artist.slug}
          serviceId={svc.id}
          start={startDate.toISOString()}
          offersStudio={artist.offersStudio}
          travelsToClient={artist.travelsToClient}
          neighborhood={artist.neighborhood}
          firstName={firstName}
          cta={artist.instantBook ? "Confirm booking" : "Send request"}
        >
          <section aria-label="Summary" className="rounded-3xl border border-line bg-surface p-6">
            <div className="mb-5 flex items-center gap-4 border-b border-line pb-5">
              <Image
                src={artist.avatarUrl}
                alt=""
                width={56}
                height={56}
                sizes="112px"
                className="size-14 rounded-full object-cover object-top"
              />
              <div className="min-w-0">
                <p className="font-playfair-display text-xl">{artist.displayName}</p>
                <p className="truncate text-sm text-ink-muted">
                  {artist.neighborhood}, {artist.borough}
                </p>
              </div>
            </div>
            <dl className="grid gap-4 text-sm">
              <Row label="Service" value={svc.name} />
              <Row label="Date" value={formatDay(startDate, tz)} />
              <Row label="Time" value={`${formatTimeRange(startDate, end, tz)} · ${formatDuration(svc.durationMinutes)}`} />
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
              <span className="font-medium">Total</span>
              <span className="font-playfair-display text-2xl">{formatPrice(svc.priceCents)}</span>
            </div>
            <p className="mt-1 text-right text-xs text-ink-muted">Paid to {firstName} on the day</p>
            <p className="mt-5 flex gap-2 rounded-2xl bg-success-soft px-4 py-3 text-xs text-success">
              <ShieldIcon className="size-4 shrink-0" />
              Free cancellation until {hours >= 48 ? `${hours / 24} days` : `${hours} hours`} before.
            </p>
          </section>
        </BookingForm>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function Notice({ title, body, href, cta = "Back to artist" }: { title: string; body: string; href: `/artists/${string}`; cta?: string }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="mb-3 font-playfair-display text-3xl">{title}</h1>
        <p className="mb-8 text-ink-muted">{body}</p>
        <Link href={href} className={buttonStyles()}>
          {cta}
        </Link>
      </main>
    </>
  );
}
