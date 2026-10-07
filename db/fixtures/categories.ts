// Slugs match the URLs of the original static site so existing links keep working.
export const CATEGORIES = [
  {
    slug: "bridal-makeup",
    name: "Bridal",
    tagline: "Where timeless elegance meets your once-in-a-lifetime glow.",
    imageUrl: "/category-1.jpg",
    highlights: ["Traditional Bridal", "Contemporary Bridal", "Destination Weddings"],
  },
  {
    slug: "party-and-glam-makeup",
    name: "Party & Glam",
    tagline: "Turn every head with bold, dazzling artistry.",
    imageUrl: "/category-2.jpg",
    highlights: ["Cocktail Party", "Red Carpet Glam", "Evening Looks"],
  },
  {
    slug: "casual-everyday-makeup",
    name: "Everyday",
    tagline: "Effortless looks that feel natural yet refined.",
    imageUrl: "/category-3.jpg",
    highlights: ["Office Ready", "Minimal & Natural", "Brunch & Day Out"],
  },
  {
    slug: "fashion-and-editorial-makeup",
    name: "Fashion & Editorial",
    tagline: "Artistry that pushes boundaries and defines trends.",
    imageUrl: "/category-4.jpg",
    highlights: ["Runway", "Photoshoots", "Creative & High Fashion"],
  },
  {
    slug: "festive-cultural-makeup",
    name: "Festive & Cultural",
    tagline: "Celebrate traditions with color, depth, and radiance.",
    imageUrl: "/category-5.jpg",
    highlights: ["Diwali, Eid & Christmas", "Navratri & Garba", "Regional Styles"],
  },
  {
    slug: "speciality-makeup",
    name: "Speciality",
    tagline: "Precision techniques crafted for the spotlight.",
    imageUrl: "/category-6.jpg",
    highlights: ["HD & Camera Ready", "Airbrush", "Theatrical & Stage"],
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
