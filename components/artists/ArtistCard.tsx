import { SmartImage } from "../ui/SmartImage";
import Link from "next/link";
import type { ArtistCard as ArtistCardData } from "@/lib/queries/artists";
import { formatNextAvailable, formatPrice } from "@/lib/format";
import { BoltIcon, StarIcon, VerifiedIcon } from "../icons";
import { FavoriteButton } from "./FavoriteButton";

export function ArtistCard({
  artist,
  saved,
  priority,
  dateFiltered,
}: {
  artist: ArtistCardData;
  saved: boolean;
  priority?: boolean;
  /** Search is filtered to one date, so show the first time that day. */
  dateFiltered?: boolean;
}) {
  const next = artist.nextAvailable;

  return (
    <article className="group relative">
      <Link
        href={`/artists/${artist.slug}`}
        className="block rounded-2xl focus-visible:outline-offset-4"
        aria-label={`${artist.name}, ${artist.neighborhood}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
          <SmartImage
            src={artist.coverUrl ?? artist.avatarUrl}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1210px) 280px, (min-width: 820px) 33vw, (min-width: 540px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-neutral-dark/45 to-transparent" />
          {artist.isOwnDemo ? (
            <span className="absolute top-3 left-3 rounded-full bg-neutral-dark px-2.5 py-1 text-[11px] font-medium text-neutral-light">
              You · demo
            </span>
          ) : (
            artist.instantBook && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-neutral-light/90 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                <BoltIcon className="size-3 text-primary" />
                Instant book
              </span>
            )
          )}
          <SmartImage
            src={artist.avatarUrl}
            alt=""
            width={48}
            height={48}
            sizes="96px"
            className="absolute bottom-3 left-3 size-12 rounded-full object-cover object-top ring-2 ring-neutral-light"
          />
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h3 className="flex min-w-0 items-center gap-1 font-playfair-display text-lg leading-tight">
            <span className="truncate">{artist.name}</span>
            {artist.isVerified && <VerifiedIcon className="size-4 shrink-0 text-primary" title="Verified" />}
          </h3>
          {artist.ratingAvg != null ? (
            <span className="flex shrink-0 items-center gap-1 text-sm">
              <StarIcon className="size-3.5 text-accent" />
              <span className="font-medium tabular-nums">{artist.ratingAvg.toFixed(2)}</span>
              <span className="text-ink-muted">({artist.reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 text-sm text-ink-muted">New</span>
          )}
        </div>
        <p className="truncate text-sm text-ink-muted">
          {artist.neighborhood}, {artist.borough}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-neutral-dark/80">{artist.headline}</p>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span>
            <span className="text-ink-muted">from </span>
            <span className="font-semibold">{formatPrice(artist.startingPriceCents)}</span>
          </span>
          {next ? (
            <span className="truncate text-xs text-success">
              {dateFiltered ? "From " : "Next: "}
              {formatNextAvailable(next.start, next.timezone, { withTime: dateFiltered })}
            </span>
          ) : (
            <span className="text-xs text-ink-muted">Fully booked</span>
          )}
        </div>
      </Link>
      <div className="absolute top-3 right-3">
        <FavoriteButton artistId={artist.id} artistName={artist.name} saved={saved} />
      </div>
    </article>
  );
}

export function ArtistCardSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="aspect-[4/5] rounded-2xl bg-secondary/70" />
      <div className="mt-3 h-5 w-2/3 rounded bg-secondary/70" />
      <div className="mt-2 h-4 w-1/2 rounded bg-secondary/50" />
      <div className="mt-2 h-4 w-5/6 rounded bg-secondary/50" />
    </div>
  );
}
