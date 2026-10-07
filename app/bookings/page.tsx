import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingRow, BookingSection } from "@/components/bookings/BookingRow";
import { locationLabel, NextAppointmentCard } from "@/components/bookings/NextAppointmentCard";
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonStyles } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { firstName } from "@/lib/format";
import { getArtistBookings, getArtistProfileForUser, getClientBookings } from "@/lib/queries/bookings";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) redirect(routes.signIn(routes.bookings));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
        {session.user.role === "artist" ? (
          <ArtistBookings userId={session.user.id} />
        ) : (
          <ClientBookings userId={session.user.id} name={session.user.name} />
        )}
      </main>
    </>
  );
}

async function ClientBookings({ userId, name }: { userId: string; name: string }) {
  const { upcoming, past } = await getClientBookings(userId);
  const [next, ...later] = upcoming;

  return (
    <>
      <PageHeader eyebrow={`Hi ${firstName(name)},`} title="Your bookings" />
      {next ? (
        <NextAppointmentCard booking={next} />
      ) : (
        <div className="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
          <h2 className="mb-2 font-playfair-display text-2xl">Nothing booked yet</h2>
          <p className="mx-auto mb-6 max-w-sm text-ink-muted">
            Find an artist for your next wedding, shoot or night out. Your appointments will show up here.
          </p>
          <Link href={routes.browse} className={buttonStyles()}>
            Find an artist
          </Link>
        </div>
      )}
      {later.length > 0 && (
        <BookingSection title="Also coming up">
          {later.map((b) => (
            <BookingRow key={b.id} booking={b} timeZone={b.artist.timezone} counterpart={{ name: b.artist.name, image: b.artist.avatarUrl }} place={locationLabel(b)} />
          ))}
        </BookingSection>
      )}
      {past.length > 0 && (
        <BookingSection title="Past">
          {past.map((b) => (
            <BookingRow key={b.id} booking={b} timeZone={b.artist.timezone} counterpart={{ name: b.artist.name, image: b.artist.avatarUrl }} place={locationLabel(b)} />
          ))}
        </BookingSection>
      )}
    </>
  );
}

async function ArtistBookings({ userId }: { userId: string }) {
  const profile = await getArtistProfileForUser(userId);
  if (!profile) redirect(routes.home);
  const { requests, upcoming, past } = await getArtistBookings(profile.id);
  const tz = profile.timezone;
  const place = (b: { location: "studio" | "client"; address: string | null }) =>
    b.location === "studio" ? "At your studio" : (b.address ?? "On location");

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every appointment, from new requests to past clients."
        actions={
          <Link href={routes.dashboard} className={buttonStyles({ variant: "secondary" })}>
            Back to dashboard
          </Link>
        }
      />
      <BookingSection title="Needs your reply" count={requests.length} empty="No requests waiting. You’re all caught up.">
        {requests.map((b) => (
          <BookingRow key={b.id} booking={b} timeZone={tz} counterpart={{ name: b.clientName, image: b.clientImage }} place={place(b)} viewer="artist" />
        ))}
      </BookingSection>
      <BookingSection title="Upcoming" count={upcoming.length} empty="Nothing confirmed yet.">
        {upcoming.map((b) => (
          <BookingRow key={b.id} booking={b} timeZone={tz} counterpart={{ name: b.clientName, image: b.clientImage }} place={place(b)} viewer="artist" />
        ))}
      </BookingSection>
      <BookingSection title="Past 90 days" count={past.length} empty="No past bookings yet.">
        {past.map((b) => (
          <BookingRow key={b.id} booking={b} timeZone={tz} counterpart={{ name: b.clientName, image: b.clientImage }} place={place(b)} viewer="artist" />
        ))}
      </BookingSection>
    </>
  );
}
