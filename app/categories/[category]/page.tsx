import artists from "../../../artists.json";
import { Artist } from "@/components/Artist";

export async function generateStaticParams() {
  const categories = new Set<string>();
  artists.forEach((artist) => {
    artist.categories.forEach((category) => {
      categories.add(category);
    });
  });

  return Array.from(categories).map((category) => ({
    category: category,
  }));
}

interface CategoryProps {
  params: Promise<{
    category: string;
  }>;
}

const Category = async ({ params }: CategoryProps) => {
  const resolvedParams = await params;
  const categoryString = resolvedParams.category || "";

  if (!categoryString) {
    return <div>Invalid category</div>;
  }
  const filteredArtists = artists.filter((artist) =>
    artist.categories.includes(categoryString)
  );

  return (
    <div className="px-2 py-8">
      <h3 className="font-playfair-display text-3xl text-center mb-8">
        Artists
      </h3>
      <div className="max-w-fit mx-auto grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-8 lg:gap-12 text-neutral-dark">
        {filteredArtists.map((artist) => {
          return (
            <Artist
              key={artist.name}
              name={artist.name}
              profilePicture={artist.profilePicture}
              price={artist.price}
              ratings={artist.ratings}
              ratingsCount={artist.ratingsCount}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Category;
