import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArtistCard } from "@/components/artists/ArtistCard";
import { HeartIcon } from "@/components/icons";
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonStyles } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getFavoriteArtists } from "@/lib/queries/artists";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Saved artists" };

export default async function SavedPage() {
  const session = await getSession();
  if (!session) redirect(routes.signIn(routes.saved));
  // Saving artists is a client feature.
  if (session.user.role === "artist") redirect(routes.dashboard);
  const saved = await getFavoriteArtists(session.user.id, session.user.demoWorkspaceId);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <PageHeader title="Saved artists" description="Your shortlist. Compare portfolios and availability, then book when you’re ready." />
        {saved.length ? (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {saved.map((artist) => (
              <li key={artist.id}>
                <ArtistCard artist={artist} saved />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
            <HeartIcon className="mx-auto mb-4 size-8 text-accent" />
            <h2 className="mb-2 font-playfair-display text-2xl">No saved artists yet</h2>
            <p className="mx-auto mb-6 max-w-sm text-ink-muted">Tap the heart on any artist to keep them here while you decide.</p>
            <Link href={routes.browse} className={buttonStyles()}>
              Browse artists
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
