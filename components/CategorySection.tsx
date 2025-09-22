import { Category } from "./Category";

export const CategorySection = () => {
  return (
    <div className="space-y-12 mb-20 text-neutral-dark font-inter">
      <div className="mb-20 ">
        <h2 className="font-playfair-display text-2xl text-center mb-4">
          Our Artistry
        </h2>
        <p className="font-inter text-center text-neutral-dark/80 max-w-96 mx-auto">
          Beauty is about confidence. We enhance your natural features with
          looks designed to match your style, occasion and personality.
        </p>
      </div>
      <div
        id="categories"
        className="flex flex-col gap-16 justify-center items-center"
      >
        <Category
          image="/category-1.jpg"
          heading="Bridal Makeup"
          description="Where timeless elegance meets your once-in-a-lifetime glow."
          subcategories={[
            "Traditional Bridal",
            "Contemporary Bridal",
            "Destination Wedding Looks",
          ]}
        />
        <Category
          image="/category-2.jpg"
          heading="Party & Glam Makeup"
          description="Turn every head with bold, dazzling artistry."
          subcategories={[
            "Cocktail Party",
            "Red Carpet Glam",
            "Evening Party Looks",
          ]}
          isReverse
        />
        <Category
          image="/category-3.jpg"
          heading="Casual/Everyday Makeup"
          description="Effortless looks that feel natural yet refined."
          subcategories={["Office Look", "Minimal/Natural", "Day Out/Brunch"]}
        />
        <Category
          image="/category-4.jpg"
          heading="Fashion & Editorial Makeup"
          description="Artistry that pushes boundaries and defines trends."
          subcategories={[
            "Runway",
            "Photoshoot Makeup",
            "Creative/High Fashion",
          ]}
          isReverse
        />
        <Category
          image="/category-5.jpg"
          heading="Festive/Cultural Makeup"
          description="Celebrate traditions with color, depth, and radiance."
          subcategories={[
            "Diwali/Eid/Christmas Looks",
            "Navratri/Garba",
            "Regional Styles",
          ]}
        />
        <Category
          image="/category-6.jpg"
          heading="Speciality Makeup"
          description="Precision techniques crafted for the spotlight."
          subcategories={[
            "HD/Camera Ready",
            "Airbrush Makeup",
            "Theatrical/Stage",
          ]}
          isReverse
        />
      </div>
    </div>
  );
};
