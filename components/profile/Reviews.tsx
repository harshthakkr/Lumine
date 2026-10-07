"use client";

import { useState, useTransition } from "react";
import { loadReviews } from "@/app/artists/actions";
import type { ReviewItem } from "@/lib/queries/artists";
import { Avatar } from "../ui/Avatar";
import { StarRating } from "../ui/StarRating";
import { buttonStyles } from "../ui/button";

type Page = { items: ReviewItem[]; nextCursor: string | null };

const monthYear = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(iso));

export function Reviews({
  artistId,
  artistName,
  artistAvatar,
  ratingAvg,
  reviewCount,
  ratingCounts,
  initial,
}: {
  artistId: string;
  artistName: string;
  artistAvatar: string;
  ratingAvg: number | null;
  reviewCount: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  initial: Page;
}) {
  const [filter, setFilter] = useState<number | undefined>();
  const [page, setPage] = useState<Page>(initial);
  const [pending, startTransition] = useTransition();

  const applyFilter = (rating: number | undefined) => {
    const next = rating === filter ? undefined : rating;
    setFilter(next);
    startTransition(async () => setPage(await loadReviews({ artistId, rating: next })));
  };

  const loadMore = () => {
    if (!page.nextCursor) return;
    startTransition(async () => {
      const more = await loadReviews({ artistId, rating: filter, cursor: page.nextCursor! });
      setPage((p) => ({ items: [...p.items, ...more.items], nextCursor: more.nextCursor }));
    });
  };

  if (!reviewCount) {
    return <p className="text-ink-muted">No reviews yet. {artistName.split(" ")[0]} is new to Luminé.</p>;
  }

  return (
    <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
      <div>
        <p className="font-playfair-display text-5xl">{ratingAvg?.toFixed(2)}</p>
        <StarRating rating={ratingAvg ?? 0} className="mt-2" />
        <p className="mt-1 text-sm text-ink-muted">{reviewCount} verified reviews</p>
        <div className="mt-6 flex flex-col gap-1" role="group" aria-label="Filter reviews by rating">
          {([5, 4, 3, 2, 1] as const).map((r) => {
            const count = ratingCounts[r];
            const share = reviewCount ? (count / reviewCount) * 100 : 0;
            const active = filter === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                disabled={!count}
                onClick={() => applyFilter(r)}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 text-sm transition-colors disabled:opacity-40 ${
                  active ? "bg-secondary" : "hover:bg-secondary/50"
                }`}
              >
                <span className="w-3 tabular-nums">{r}</span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-neutral-dark transition-[width] duration-700"
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span className="w-8 text-right text-xs tabular-nums text-ink-muted">{count}</span>
              </button>
            );
          })}
        </div>
        {filter && (
          <button type="button" onClick={() => applyFilter(undefined)} className="mt-3 text-xs underline underline-offset-4">
            Show all reviews
          </button>
        )}
      </div>

      <div aria-busy={pending} className={`transition-opacity ${pending ? "opacity-60" : ""}`}>
        <ul className="divide-y divide-line">
          {page.items.map((review) => (
            <li key={review.id} className="py-6 first:pt-0">
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={review.authorName} size={40} />
                <div className="min-w-0">
                  <p className="font-medium">{review.authorName}</p>
                  <p className="text-xs text-ink-muted">
                    {monthYear(review.createdAt)} · {review.serviceName}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} className="mb-2" />
              {review.body ? (
                <p className="leading-relaxed text-neutral-dark/85">{review.body}</p>
              ) : (
                <p className="text-sm text-ink-muted italic">Rated without a written review.</p>
              )}
              {review.artistReply && (
                <div className="mt-4 ml-4 flex gap-3 border-l-2 border-secondary pl-4">
                  <Avatar name={artistName} src={artistAvatar} size={28} />
                  <div>
                    <p className="text-xs font-medium">Response from {artistName.split(" ")[0]}</p>
                    <p className="mt-1 text-sm text-neutral-dark/80">{review.artistReply}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {page.nextCursor && (
          <button type="button" onClick={loadMore} disabled={pending} className={buttonStyles({ variant: "secondary", className: "mt-4" })}>
            {pending ? "Loading…" : "Show more reviews"}
          </button>
        )}
      </div>
    </div>
  );
}
