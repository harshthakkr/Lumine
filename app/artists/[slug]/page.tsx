import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistCard } from "@/components/artists/ArtistCard";
import { FavoriteButton } from "@/components/artists/FavoriteButton";
import { Footer } from "@/components/Footer";
import {
  BoltIcon,
  ClockIcon,
  GlobeIcon,
  HomeIcon,
  MapPinIcon,
  ShieldIcon,
  StarIcon,
  StudioIcon,
  VerifiedIcon,
} from "@/components/icons";
import { Navbar } from "@/components/Navbar";
import { BookingProvider } from "@/components/profile/BookingContext";
import { BookingCard, MobileBookingBar } from "@/components/profile/BookingCard";
import { Gallery } from "@/components/profile/Gallery";
import { Reviews } from "@/components/profile/Reviews";
import { ServiceList } from "@/components/profile/ServiceList";
import { ShareButton } from "@/components/profile/ShareButton";
import { SlotPicker } from "@/components/profile/SlotPicker";
import { CANCELLATION_WINDOW_HOURS } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatPrice, pluralize } from "@/lib/format";
import {
  getArtistProfile,
  getArtistReviews,
  getFavoriteArtistIds,
  getSimilarArtists,
  type ArtistProfile,
} from "@/lib/queries/artists";
import { SLOT_PAGE_DAYS } from "@/lib/availability";
import { getServiceAvailability } from "@/lib/queries/availability";
import { routes } from "@/lib/routes";
import { toLocalDate } from "@/lib/time";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const session = await getSession();
  const artist = await getArtistProfile(slug, session?.user.demoWorkspaceId);
  if (!artist) return { title: "Artist not found" };
  const cover = artist.portfolio[0]?.url ?? artist.avatarUrl;
  return {
    title: `${artist.displayName} · Makeup artist in ${artist.neighborhood}`,
    description: artist.headline,
    openGraph: { title: artist.displayName, description: artist.headline, images: [cover] },
  };
}

function policyText(artist: ArtistProfile) {
  const hours = CANCELLATION_WINDOW_HOURS[artist.cancellationPolicy];
  const window = hours >= 48 ? `${hours / 24} days` : `${hours} hours`;
  return `Free cancellation up to ${window} before your appointment.`;
}

function noticeText(hours: number) {
  if (hours < 24) return `Book as little as ${hours} hours ahead`;
  const days = Math.round(hours / 24);
  return `Book at least ${pluralize(days, "day")} ahead`;
}

export default async function ArtistPage({ params, searchParams }: Props) {
  const [{ slug }, { service: requestedService }, session] = await Promise.all([params, searchParams, getSession()]);
  const artist = await getArtistProfile(slug, session?.user.demoWorkspaceId);
  if (!artist || !artist.services.length) notFound();

  const initialService = artist.services.find((s) => s.id === requestedService) ?? artist.services[0];
  const [availability, reviewPage, similar, saved] = await Promise.all([
    getServiceAvailability(artist.id, initialService.durationMinutes, null, SLOT_PAGE_DAYS, { seek: true }),
    getArtistReviews(artist.id),
    getSimilarArtists(artist, session?.user.demoWorkspaceId),
    getFavoriteArtistIds(session?.user.id),
  ]);
  const firstName = artist.displayName.split(" ")[0];
  // An artist looking at their own page sees it as clients do, minus booking.
  const isOwner = session?.user.id === artist.userId;
  const minPrice = Math.min(...artist.services.map((s) => s.priceCents));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: artist.displayName,
    description: artist.headline,
    image: artist.portfolio[0]?.url ?? artist.avatarUrl,
    address: { "@type": "PostalAddress", addressLocality: artist.neighborhood, addressRegion: "NY", addressCountry: "US" },
    priceRange: `From ${formatPrice(minPrice)}`,
    ...(artist.ratingAvg != null && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: artist.ratingAvg, reviewCount: artist.reviewCount },
    }),
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <BookingProvider
        artist={{
          id: artist.id,
          slug: artist.slug,
          name: artist.displayName,
          timezone: artist.timezone,
          instantBook: artist.instantBook,
        }}
        services={artist.services}
        initialServiceId={initialService.id}
        initialAvailability={{ from: availability.from, days: availability.days }}
        today={toLocalDate(new Date(), artist.timezone)}
      >
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-32 sm:px-8 lg:pb-20">
          {isOwner && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-neutral-dark px-5 py-4 text-sm text-neutral-light sm:flex-row sm:items-center sm:justify-between">
              <p>
                <span className="font-medium">This is your public profile.</span>{" "}
                <span className="text-neutral-light/70">It’s exactly what clients see when they find you.</span>
              </p>
              <Link href={routes.dashboard} className="shrink-0 font-medium text-primary underline-offset-4 hover:underline">
                Back to dashboard
              </Link>
            </div>
          )}
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/artists" className="hover:text-neutral-dark">
                  Artists
                </Link>
              </li>
              {artist.categories[0] && (
                <>
                  <li aria-hidden>/</li>
                  <li>
                    <Link
                      href={`/artists?category=${artist.categories[0].slug}` as "/artists"}
                      className="hover:text-neutral-dark"
                    >
                      {artist.categories[0].name}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-neutral-dark">
                {artist.displayName}
              </li>
            </ol>
          </nav>

          <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src={artist.avatarUrl}
                alt={`Portrait of ${artist.displayName}`}
                width={80}
                height={80}
                priority
                sizes="160px"
                className="size-16 shrink-0 rounded-full object-cover object-top sm:size-20"
              />
              <div>
                <h1 className="flex items-center gap-2 font-playfair-display text-3xl sm:text-4xl">
                  {artist.displayName}
                  {artist.isVerified && <VerifiedIcon className="size-6 text-primary" title="Verified artist" />}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                  {artist.ratingAvg != null && (
                    <a href="#reviews" className="inline-flex items-center gap-1 text-neutral-dark hover:underline">
                      <StarIcon className="size-3.5 text-accent" />
                      <span className="font-medium">{artist.ratingAvg.toFixed(2)}</span>
                      <span className="text-ink-muted">({pluralize(artist.reviewCount, "review")})</span>
                    </a>
                  )}
                  <span aria-hidden className="hidden sm:inline">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="size-3.5" /> {artist.neighborhood}, {artist.borough}
                  </span>
                  {artist.isOwnDemo && !isOwner && (
                    <span className="rounded-full bg-neutral-dark px-2 py-0.5 text-[11px] text-neutral-light">
                      This is you · demo
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <ShareButton title={`${artist.displayName} on Luminé`} />
              <FavoriteButton artistId={artist.id} artistName={artist.displayName} saved={saved.has(artist.id)} variant="inline" />
            </div>
          </header>

          <Gallery
            artistName={artist.displayName}
            photos={artist.portfolio.map((p) => ({ id: p.id, url: p.url, alt: p.alt, width: p.width, height: p.height }))}
          />

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
            <div className="min-w-0">
              <section aria-labelledby="about" className="border-b border-line pb-10">
                <h2 id="about" className="mb-1 font-playfair-display text-2xl">
                  {artist.headline}
                </h2>
                <ul className="mt-5 mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat value={`${artist.yearsExperience} yrs`} label="Experience" />
                  <Stat value={artist.completedBookings.toLocaleString("en-US")} label="Bookings on Luminé" />
                  <Stat value={artist.languages.length ? artist.languages.join(", ") : "English"} label="Languages" small />
                  <Stat
                    value={artist.instantBook ? "Instant" : "Within 24h"}
                    label="Confirmation"
                    icon={artist.instantBook ? <BoltIcon className="size-3.5 text-primary" /> : undefined}
                  />
                </ul>
                <div className="space-y-4 leading-relaxed text-neutral-dark/85">
                  {artist.bio.split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
                {artist.instagramHandle && (
                  <a
                    href={`https://instagram.com/${artist.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm text-ink-muted underline-offset-4 hover:underline"
                  >
                    @{artist.instagramHandle}
                  </a>
                )}
              </section>

              <section aria-labelledby="services" className="border-b border-line py-10">
                <h2 id="services" className="mb-1 font-playfair-display text-2xl">
                  Services
                </h2>
                <p className="mb-5 text-sm text-ink-muted">Choose one to see when {firstName} is free.</p>
                <ServiceList />
              </section>

              <section id="availability" aria-labelledby="availability-heading" className="scroll-mt-32 border-b border-line py-10">
                <h2 id="availability-heading" className="mb-5 font-playfair-display text-2xl">
                  Availability
                </h2>
                <SlotPicker />
              </section>

              <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-32 border-b border-line py-10">
                <h2 id="reviews-heading" className="mb-6 font-playfair-display text-2xl">
                  Reviews
                </h2>
                <Reviews
                  artistId={artist.id}
                  artistName={artist.displayName}
                  artistAvatar={artist.avatarUrl}
                  ratingAvg={artist.ratingAvg}
                  reviewCount={artist.reviewCount}
                  ratingCounts={artist.ratingCounts}
                  initial={reviewPage}
                />
              </section>

              <section aria-labelledby="good-to-know" className="py-10">
                <h2 id="good-to-know" className="mb-6 font-playfair-display text-2xl">
                  Good to know
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  <Fact icon={<ShieldIcon className="size-5" />} title="Cancellation">
                    {policyText(artist)}
                  </Fact>
                  <Fact icon={<ClockIcon className="size-5" />} title="Notice">
                    {noticeText(artist.leadTimeHours)}, up to {artist.bookingWindowDays} days out.
                  </Fact>
                  {artist.offersStudio && (
                    <Fact icon={<StudioIcon className="size-5" />} title="Studio">
                      Private studio in {artist.neighborhood}. Exact address shared after booking.
                    </Fact>
                  )}
                  {artist.travelsToClient && (
                    <Fact icon={<HomeIcon className="size-5" />} title="Comes to you">
                      Travels to homes, hotels and venues across New York.
                    </Fact>
                  )}
                  <Fact icon={<GlobeIcon className="size-5" />} title="Languages">
                    {artist.languages.join(", ")}
                  </Fact>
                </ul>
              </section>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-28">
                <BookingCard policyNote={policyText(artist)} preview={isOwner} />
              </div>
            </div>
          </div>

          {similar.length > 0 && (
            <section aria-labelledby="similar" className="mt-10 border-t border-line pt-12">
              <h2 id="similar" className="mb-6 font-playfair-display text-2xl">
                You might also like
              </h2>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 lg:grid-cols-4">
                {similar.map((a) => (
                  <li key={a.id}>
                    <ArtistCard artist={a} saved={saved.has(a.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
        {!isOwner && <MobileBookingBar />}
      </BookingProvider>
      <Footer />
    </>
  );
}

function Stat({ value, label, icon, small }: { value: string; label: string; icon?: React.ReactNode; small?: boolean }) {
  return (
    <li className="rounded-2xl bg-secondary/40 px-4 py-3">
      <p className={`flex items-center gap-1 font-medium ${small ? "text-sm leading-snug" : "text-lg"}`}>
        {icon}
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{label}</p>
    </li>
  );
}

function Fact({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-line p-5">
      <span className="text-primary">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-1 block text-sm text-ink-muted">{children}</span>
      </span>
    </li>
  );
}
