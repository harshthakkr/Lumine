import { listCategories } from "@/lib/queries/artists";
import { getLandingStats } from "@/lib/queries/landing";
import { HeroSearch } from "../HeroSearch";
import { StarIcon } from "../icons";
import { OptimizedVideo } from "../OptimizedVideo";

export async function Hero() {
  const [categories, stats] = await Promise.all([listCategories(), getLandingStats()]);

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden">
      <OptimizedVideo
        src="/hero-video.mp4"
        poster="/category-1.jpg"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-neutral-dark/80 via-neutral-dark/30 to-neutral-dark/10" />

      <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-14 text-center text-neutral-light sm:px-8">
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-neutral-light/80 uppercase">Makeup artists · New York</p>
        <h1 className="mx-auto mb-4 max-w-3xl font-playfair-display text-4xl leading-tight font-semibold md:text-6xl">
          Glam up anytime, anywhere
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base text-neutral-light/85 md:text-lg">
          Compare portfolios, real reviews and live availability, then book a trusted artist for your wedding, shoot or
          night out.
        </p>
        <HeroSearch categories={categories.map(({ slug, name }) => ({ slug, name }))} />
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-light/80">
          <span className="inline-flex items-center gap-1.5">
            <StarIcon className="size-4 text-primary" />
            {stats.avgRating} average
          </span>
          <span>{stats.reviews.toLocaleString("en-US")} verified reviews</span>
          <span>{stats.artists} vetted artists</span>
        </p>
      </div>
    </section>
  );
}
