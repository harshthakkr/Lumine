import type { CategorySlug } from "./categories";

export type ServiceTemplate = {
  category: CategorySlug;
  name: string;
  description: string;
  durationMinutes: number;
};

/**
 * Services artists commonly offer. Each artist picks a handful and sets
 * their own price, so menus overlap the way they do on real marketplaces.
 */
export const SERVICE_TEMPLATES = {
  bridalDay: {
    category: "bridal-makeup",
    name: "Bridal Makeup — Wedding Day",
    description:
      "Long-wear bridal look built to last from first look to last dance. Includes lashes, skin prep and a touch-up kit for the day.",
    durationMinutes: 150,
  },
  bridalTrial: {
    category: "bridal-makeup",
    name: "Bridal Trial",
    description:
      "A relaxed session to try two directions, photograph them in daylight and lock in your wedding-day look.",
    durationMinutes: 90,
  },
  bridalParty: {
    category: "bridal-makeup",
    name: "Bridesmaid / Mother of the Bride",
    description: "A polished look that complements the bride without competing. Lashes included.",
    durationMinutes: 60,
  },
  traditionalBridal: {
    category: "bridal-makeup",
    name: "Traditional Bridal (South Asian)",
    description:
      "Full traditional bridal with jewellery and dupatta setting, built around heavy outfits and long ceremonies.",
    durationMinutes: 180,
  },
  softGlam: {
    category: "party-and-glam-makeup",
    name: "Soft Glam",
    description: "Sculpted, glowing skin with a diffused eye. Camera friendly without feeling heavy.",
    durationMinutes: 60,
  },
  eveningGlam: {
    category: "party-and-glam-makeup",
    name: "Full Evening Glam",
    description: "Defined eyes, lashes, contour and a bold or classic lip. Made for nights out and galas.",
    durationMinutes: 75,
  },
  redCarpet: {
    category: "party-and-glam-makeup",
    name: "Red Carpet Glam",
    description:
      "Event-grade glam with skin prep, sculpting and flash-tested products for press walls and photographers.",
    durationMinutes: 90,
  },
  everydayNatural: {
    category: "casual-everyday-makeup",
    name: "Everyday Natural",
    description: "Fresh, skin-first makeup that looks like you on a very good day.",
    durationMinutes: 45,
  },
  lesson: {
    category: "casual-everyday-makeup",
    name: "1:1 Makeup Lesson",
    description:
      "Learn a routine that works for your face using the products you already own. You leave with a written face chart.",
    durationMinutes: 90,
  },
  headshot: {
    category: "casual-everyday-makeup",
    name: "Headshot & LinkedIn Ready",
    description: "Polished, natural makeup tuned for studio lighting and close-up headshots.",
    durationMinutes: 45,
  },
  editorialShoot: {
    category: "fashion-and-editorial-makeup",
    name: "Editorial Shoot — Half Day",
    description:
      "On-set artist for up to four hours: looks, touch-ups and changes between setups. Moodboard review beforehand.",
    durationMinutes: 240,
  },
  runway: {
    category: "fashion-and-editorial-makeup",
    name: "Runway & Show",
    description: "Backstage key or team artist for shows and presentations. Priced per artist.",
    durationMinutes: 180,
  },
  creative: {
    category: "fashion-and-editorial-makeup",
    name: "Creative / Avant-Garde Look",
    description: "Graphic liner, colour, texture and embellishment for concepts that need to stop the scroll.",
    durationMinutes: 120,
  },
  festiveGlam: {
    category: "festive-cultural-makeup",
    name: "Festive Glam (Diwali · Eid · Christmas)",
    description: "Rich, celebratory makeup designed to hold up through long evenings with family.",
    durationMinutes: 75,
  },
  sangeetMehendi: {
    category: "festive-cultural-makeup",
    name: "Mehendi & Sangeet Look",
    description: "Colourful, dance-proof makeup for pre-wedding celebrations. Hair setting available on request.",
    durationMinutes: 90,
  },
  garba: {
    category: "festive-cultural-makeup",
    name: "Navratri / Garba Night",
    description: "Sweat-resistant, bright makeup with a festive eye. Sets in under an hour.",
    durationMinutes: 60,
  },
  hdCamera: {
    category: "speciality-makeup",
    name: "HD / Camera-Ready",
    description: "Built for 4K video and harsh lighting: invisible texture, controlled shine, colour-true skin.",
    durationMinutes: 60,
  },
  airbrush: {
    category: "speciality-makeup",
    name: "Airbrush Full Face",
    description: "Lightweight airbrushed base that is sweat- and humidity-resistant. Ideal for summer events.",
    durationMinutes: 75,
  },
  stage: {
    category: "speciality-makeup",
    name: "Theatrical & Stage",
    description: "Stage-weight makeup readable from the back row, for theatre, dance and performances.",
    durationMinutes: 90,
  },
} satisfies Record<string, ServiceTemplate>;

export type ServiceTemplateKey = keyof typeof SERVICE_TEMPLATES;
