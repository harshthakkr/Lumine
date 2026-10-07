import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArtistCard, ArtistCardSkeleton } from "@/components/artists/ArtistCard";
import { DiscoveryProvider, ResultsFrame } from "@/components/discovery/DiscoveryProvider";
import { FilterBar, SortSelect } from "@/components/discovery/FilterBar";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { buttonStyles } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { pluralize } from "@/lib/format";
import { getFavoriteArtistIds, listCategories, searchArtists } from "@/lib/queries/artists";
import { countRefinements, parseSearchParams, toQueryString, type SearchFilters } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseSearchParams(await searchParams);
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === filters.category);
  return {
    title: category ? `${category.name} makeup artists in New York` : "Makeup artists in New York",
    description: category?.tagline ?? "Compare portfolios, prices, reviews and live availability, then book in minutes.",
    alternates: { canonical: `/artists${category ? `?category=${category.slug}` : ""}` },
  };
}

export default async function ArtistsPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === filters.category);

  return (
    <>
      <Navbar />
      <DiscoveryProvider filters={filters}>
        <main className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-8">
          <header className="mb-6">
            <h1 className="font-playfair-display text-3xl sm:text-4xl">
              {category ? `${category.name} makeup artists` : "Makeup artists"}{" "}
              <span className="text-ink-muted">in New York</span>
            </h1>
            {category && <p className="mt-2 text-ink-muted">{category.tagline}</p>}
          </header>
          <FilterBar categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          <ResultsFrame>
            <Suspense key={toQueryString(filters)} fallback={<ResultsSkeleton />}>
              <Results filters={filters} />
            </Suspense>
          </ResultsFrame>
        </main>
      </DiscoveryProvider>
      <Footer />
    </>
  );
}

async function Results({ filters }: { filters: SearchFilters }) {
  const session = await getSession();
  const [artists, saved] = await Promise.all([
    searchArtists(filters, session?.user.demoWorkspaceId),
    getFavoriteArtistIds(session?.user.id),
  ]);

  if (!artists.length) return <EmptyState filters={filters} />;

  return (
    <section aria-label="Results" className="mt-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {pluralize(artists.length, "artist")}
          {filters.date && " with openings that day"}
        </p>
        <div className="md:hidden">
          <SortSelect />
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {artists.map((artist, i) => (
          <li key={artist.id}>
            <ArtistCard artist={artist} saved={saved.has(artist.id)} priority={i < 4} dateFiltered={!!filters.date} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({ filters }: { filters: SearchFilters }) {
  const refinements = countRefinements(filters);
  // Suggest the single most likely culprit to loosen.
  const suggestion: { label: string; patch: Partial<SearchFilters> } | null = filters.date
    ? { label: "Try any date", patch: { date: undefined } }
    : filters.maxPrice
      ? { label: "Remove the price limit", patch: { maxPrice: undefined } }
      : filters.area.length
        ? { label: "Search all areas", patch: { area: [] } }
        : filters.q
          ? { label: "Clear the search", patch: { q: undefined } }
          : null;

  return (
    <div className="mt-10 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <h2 className="mb-2 font-playfair-display text-2xl">No artists match all of that</h2>
      <p className="mx-auto mb-6 max-w-md text-ink-muted">
        {refinements > 1
          ? "You’ve got quite a few filters on. Loosening one usually turns up great options."
          : "Try a different search or browse every artist instead."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {suggestion && (
          <Link
            href={`/artists${toQueryString({ ...filters, ...suggestion.patch })}` as "/artists"}
            className={buttonStyles()}
          >
            {suggestion.label}
          </Link>
        )}
        <Link href="/artists" className={buttonStyles({ variant: "secondary" })}>
          See all artists
        </Link>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8" aria-label="Loading artists">
      <div className="mb-5 h-4 w-24 animate-pulse rounded bg-secondary/60" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
