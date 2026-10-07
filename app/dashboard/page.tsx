import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { Schedule } from "@/components/dashboard/Schedule";
import { StatTile } from "@/components/dashboard/StatTile";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonStyles } from "@/components/ui/button";
import { StarRating } from "@/components/ui/StarRating";
import { getSession } from "@/lib/auth";
import { firstName, formatPrice, formatRating, formatRelative } from "@/lib/format";
import { getArtistDashboard, getArtistProfileForUser } from "@/lib/queries/bookings";
import { routes } from "@/lib/routes";
import { getZonedParts } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(timeZone: string) {
  const hour = getZonedParts(new Date(), timeZone).hour;
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function earningsTrend(current: number, previous: number) {
  if (!previous) return "Last 30 days";
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "Same as the previous 30 days";
  return `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}% vs previous 30 days`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/dashboard");
  if (session.user.role !== "artist") redirect(routes.bookings);

  const profile = await getArtistProfileForUser(session.user.id);
  if (!profile) redirect(routes.home);

  const tz = profile.timezone;
  const { requests, upcoming, stats, latestReviews } = await getArtistDashboard(profile.id);
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <PageHeader
          eyebrow={today}
          title={`${greeting(tz)}, ${firstName(profile.displayName)}`}
          actions={
            <>
              <Link href={routes.bookings} className={buttonStyles({ variant: "secondary" })}>
                All bookings
              </Link>
              <Link href={routes.artist(profile.slug)} className={buttonStyles({ variant: "secondary" })}>
                View public profile
              </Link>
            </>
          }
        />

        <section aria-label="Summary" className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatTile
            label="Requests"
            value={String(requests.length)}
            detail={requests.length ? "Waiting for your reply" : "You’re all caught up"}
            highlight={requests.length > 0}
          />
          <StatTile label="This week" value={String(stats.upcomingWeek)} detail="Confirmed appointments" />
          <StatTile
            label="Earned"
            value={formatPrice(stats.earnings30d)}
            detail={earningsTrend(stats.earnings30d, stats.earningsPrev30d)}
          />
          <StatTile
            label="Rating"
            value={formatRating(profile.ratingAvg)}
            detail={`${profile.reviewCount} reviews`}
          />
        </section>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section aria-labelledby="requests-heading">
            <h2 id="requests-heading" className="mb-4 font-playfair-display text-2xl">
              Booking requests
            </h2>
            {requests.length ? (
              <ul className="space-y-4">
                {requests.map((booking) => (
                  <RequestCard key={booking.id} booking={booking} timeZone={tz} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
                No pending requests. New ones will appear here.
              </p>
            )}

            {latestReviews.length > 0 && (
              <>
                <h2 className="mt-12 mb-4 font-playfair-display text-2xl">Latest reviews</h2>
                <ul className="space-y-3">
                  {latestReviews.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-line bg-surface p-4">
                      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{review.authorName}</span>
                        <span className="text-xs text-ink-muted">{formatRelative(review.createdAt)}</span>
                      </div>
                      <StarRating rating={review.rating} className="mb-2" />
                      {review.body ? (
                        <p className="text-sm text-neutral-dark/80">{review.body}</p>
                      ) : (
                        <p className="text-sm text-ink-muted italic">Left a rating without a comment.</p>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="mb-4 font-playfair-display text-2xl">
              Next two weeks
            </h2>
            <Schedule bookings={upcoming} timeZone={tz} />
          </section>
        </div>
      </main>
    </>
  );
}
