import { getSession } from "@/lib/auth";
import { getFavoriteArtistIds } from "@/lib/queries/artists";
import { getFeaturedArtists } from "@/lib/queries/landing";
import { routes } from "@/lib/routes";
import { ArtistCard } from "../artists/ArtistCard";
import { SectionHeader } from "./SectionHeader";

export async function FeaturedArtists() {
  const session = await getSession();
  const [artists, saved] = await Promise.all([getFeaturedArtists(), getFavoriteArtistIds(session?.user.id)]);
  if (!artists.length) return null;

  return (
    <section className="bg-secondary/25">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
        <SectionHeader
          eyebrow="Available this week"
          title="Top-rated artists with open times"
          description="Ranked by reviews and booked straight from their real calendars."
          link={{ href: routes.browse, label: "See everyone" }}
        />
        <ul className="grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 lg:grid-cols-4">
          {artists.map((artist) => (
            <li key={artist.id}>
              <ArtistCard artist={artist} saved={saved.has(artist.id)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
