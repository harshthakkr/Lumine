import { addDays, toLocalDate, weekdayOf, zonedTimeToUtc, type LocalDate } from "@/lib/time";
import { ARTIST_REPLIES, CATEGORY_REVIEWS, GENERAL_REVIEWS } from "./reviews";
import { BOOKING_NOTES, CLIENT_ADDRESSES } from "./people";
import type { CategorySlug } from "./categories";
import { DAY_INDEX, type ArtistFixture } from "./artists";
import { PORTFOLIO_POOLS, unsplashUrl, type PortfolioPool } from "./portfolio";
import { SERVICE_TEMPLATES, type ServiceTemplateKey } from "./service-templates";
import type {
  artistProfiles,
  availabilityRules,
  bookings,
  portfolioImages,
  reviews,
  services,
} from "@/db/schema";

type NewBooking = typeof bookings.$inferInsert & { id: string };
type NewReview = typeof reviews.$inferInsert;

// ---------------------------------------------------------------------------
// Deterministic randomness, so `db:seed` produces the same world every run.

export type Rng = ReturnType<typeof createRng>;

export function createRng(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    chance: (p: number) => next() < p,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    shuffle: <T>(items: readonly T[]): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

/** Seed derived from a string, e.g. a workspace id. */
export function seedFrom(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function bookingReference(rng: Rng) {
  let ref = "LUM-";
  for (let i = 0; i < 6; i++) ref += rng.pick(REFERENCE_ALPHABET.split(""));
  return ref;
}

// ---------------------------------------------------------------------------
// Static profile rows

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Which photo pools best represent each kind of service.
const POOLS_FOR_SERVICE: Partial<Record<ServiceTemplateKey, PortfolioPool[]>> = {
  traditionalBridal: ["southAsian"],
  sangeetMehendi: ["southAsian"],
  festiveGlam: ["southAsian", "glam"],
  garba: ["southAsian"],
  creative: ["editorial"],
  runway: ["editorial"],
  editorialShoot: ["editorial", "glam"],
  stage: ["editorial"],
};
const POOLS_FOR_CATEGORY: Record<CategorySlug, PortfolioPool[]> = {
  "bridal-makeup": ["bridal", "natural"],
  "party-and-glam-makeup": ["glam"],
  "casual-everyday-makeup": ["natural"],
  "fashion-and-editorial-makeup": ["editorial"],
  "festive-cultural-makeup": ["southAsian"],
  "speciality-makeup": ["glam", "natural"],
};

/** Tracks photo usage across artists so portfolios overlap as little as possible. */
export type PhotoUsage = Map<string, number>;

function pickPortfolio(fixture: ArtistFixture, rng: Rng, usage: PhotoUsage, count: number) {
  const pools = fixture.services.flatMap((s) => {
    const category = SERVICE_TEMPLATES[s.key].category;
    return POOLS_FOR_SERVICE[s.key] ?? POOLS_FOR_CATEGORY[category];
  });
  const chosen: { photo: (typeof PORTFOLIO_POOLS)[PortfolioPool][number]; pool: PortfolioPool }[] = [];
  // Round-robin over the artist's pools (weighted by how many services use
  // each), preferring the least-used photos, so a menu that's mostly bridal
  // yields a mostly bridal portfolio.
  for (let i = 0; chosen.length < count && i < count * 4; i++) {
    const pool = pools[i % pools.length];
    const candidates = PORTFOLIO_POOLS[pool].filter(([id]) => !chosen.some((c) => c.photo[0] === id));
    if (!candidates.length) continue;
    const minUse = Math.min(...candidates.map(([id]) => usage.get(id) ?? 0));
    const photo = rng.pick(candidates.filter(([id]) => (usage.get(id) ?? 0) === minUse));
    usage.set(photo[0], (usage.get(photo[0]) ?? 0) + 1);
    chosen.push({ photo, pool });
  }
  return chosen;
}

const POOL_CATEGORY: Record<PortfolioPool, CategorySlug> = {
  bridal: "bridal-makeup",
  southAsian: "festive-cultural-makeup",
  glam: "party-and-glam-makeup",
  natural: "casual-everyday-makeup",
  editorial: "fashion-and-editorial-makeup",
};

const POOL_ALT: Record<PortfolioPool, string> = {
  bridal: "Bridal makeup",
  southAsian: "Traditional bridal and festive makeup",
  glam: "Glam makeup",
  natural: "Natural, skin-first makeup",
  editorial: "Editorial makeup",
};

export function buildArtistRows(
  fixture: ArtistFixture,
  ids: { artistId: string; userId: string; slug?: string; isPublished?: boolean },
  portfolio: { rng: Rng; usage: PhotoUsage },
) {
  const [neighborhood, borough] = fixture.neighborhood.split(",").map((part) => part.trim());
  const profile = {
    id: ids.artistId,
    userId: ids.userId,
    slug: ids.slug ?? fixture.slug,
    displayName: fixture.name,
    headline: fixture.headline,
    bio: fixture.bio,
    avatarUrl: fixture.avatar,
    neighborhood,
    borough,
    city: "New York",
    yearsExperience: fixture.yearsExperience,
    languages: fixture.languages,
    instagramHandle: fixture.instagram,
    offersStudio: fixture.offersStudio,
    travelsToClient: fixture.travelsToClient,
    instantBook: fixture.instantBook,
    leadTimeHours: fixture.leadTimeHours,
    // Artists with long notice periods protect their calendars more strictly.
    cancellationPolicy:
      fixture.leadTimeHours >= 72 ? "strict" : fixture.instantBook ? "flexible" : "moderate",
    isPublished: ids.isPublished ?? true,
    isVerified: fixture.isVerified,
  } satisfies typeof artistProfiles.$inferInsert;

  const serviceRows = fixture.services.map((s, i) => {
    const template = SERVICE_TEMPLATES[s.key];
    return {
      id: crypto.randomUUID(),
      artistId: ids.artistId,
      categorySlug: template.category,
      name: template.name,
      description: template.description,
      durationMinutes: template.durationMinutes,
      priceCents: s.priceUsd * 100,
      sortOrder: i,
    } satisfies typeof services.$inferInsert;
  });

  const availabilityRows = fixture.hours.flatMap((block) =>
    block.days.map(
      (day) =>
        ({
          artistId: ids.artistId,
          weekday: DAY_INDEX[day],
          startMinute: toMinutes(block.start),
          endMinute: toMinutes(block.end),
        }) satisfies typeof availabilityRules.$inferInsert,
    ),
  );

  // An artist appears in a category exactly when they offer a service in it.
  const categorySlugs = [...new Set(serviceRows.map((s) => s.categorySlug))];

  const portfolioRows = pickPortfolio(fixture, portfolio.rng, portfolio.usage, 10).map(
    ({ photo: [id, width, height], pool }, i) =>
      ({
        artistId: ids.artistId,
        categorySlug: POOL_CATEGORY[pool],
        url: unsplashUrl(id),
        alt: `${POOL_ALT[pool]} by ${fixture.name}`,
        width,
        height,
        sortOrder: i,
      }) satisfies typeof portfolioImages.$inferInsert,
  );

  const categoryRows = categorySlugs.map((categorySlug) => ({
    artistId: ids.artistId,
    categorySlug,
  }));

  return { profile, serviceRows, availabilityRows, portfolioRows, categoryRows };
}

// ---------------------------------------------------------------------------
// Booking + review history

export type Interval = { start: number; end: number };

export type HistoryClient = { id: string; name: string };

type GeneratedService = {
  id: string;
  name: string;
  categorySlug: string;
  durationMinutes: number;
  priceCents: number;
};

export type HistoryOptions = {
  rng: Rng;
  fixture: ArtistFixture;
  artistId: string;
  timezone?: string;
  services: GeneratedService[];
  availability: { weekday: number; startMinute: number; endMinute: number }[];
  clients: HistoryClient[];
  now: Date;
  pastDays: number;
  futureDays: number;
  /** Share of a working day's capacity that upcoming bookings tend to fill. */
  futureFill?: number;
  /** Intervals already taken on this artist's calendar (e.g. existing bookings). */
  occupied?: Interval[];
};

const DAYS_PER_MONTH = 30.4;

function ratingFor(rng: Rng, quality: number): 2 | 3 | 4 | 5 {
  // P(5) is chosen so the expected rating equals `quality`; the remaining
  // mass is spread 65/25/10 over 4/3/2 stars (mean 3.55).
  const p5 = Math.min(0.98, Math.max(0, (quality - 3.55) / 1.45));
  if (rng.chance(p5)) return 5;
  const r = rng.next();
  return r < 0.65 ? 4 : r < 0.9 ? 3 : 2;
}

function overlaps(occupied: Interval[], candidate: Interval) {
  return occupied.some((o) => candidate.start < o.end && o.start < candidate.end);
}

/**
 * Find a free start time on `date` for `durationMinutes`, on a 30-minute
 * grid within the artist's working hours. Returns null if the day is full.
 */
export function findSlot(
  rng: Rng,
  date: LocalDate,
  durationMinutes: number,
  rules: HistoryOptions["availability"],
  timezone: string,
  occupied: Interval[],
) {
  const weekday = weekdayOf(date);
  const candidates: Interval[] = [];
  for (const rule of rules.filter((r) => r.weekday === weekday)) {
    for (let m = rule.startMinute; m + durationMinutes <= rule.endMinute; m += 30) {
      const start = zonedTimeToUtc(date, m, timezone).getTime();
      candidates.push({ start, end: start + durationMinutes * 60_000 });
    }
  }
  const free = candidates.filter((c) => !overlaps(occupied, c));
  return free.length ? rng.pick(free) : null;
}

function fillTemplate(text: string, vars: { artist?: string; client?: string }) {
  return text
    .replaceAll("{artist}", vars.artist ?? "")
    .replaceAll("{client}", vars.client ?? "");
}

export function generateHistory(options: HistoryOptions) {
  const { rng, fixture, artistId, now, clients } = options;
  const timezone = options.timezone ?? "America/New_York";
  const occupied = [...(options.occupied ?? [])];
  const bookingRows: NewBooking[] = [];
  const reviewRows: NewReview[] = [];
  const usedReviewTexts = new Set<string>();
  const regulars: HistoryClient[] = [];
  const artistFirstName = fixture.name.split(" ")[0];

  const workingDaysPerWeek = new Set(options.availability.map((r) => r.weekday)).size || 1;
  const perWorkingDay = fixture.monthlyBookings / ((DAYS_PER_MONTH * workingDaysPerWeek) / 7);

  const pickClient = () => {
    // Roughly a quarter of bookings come from returning clients.
    if (regulars.length > 3 && rng.chance(0.25)) return rng.pick(regulars);
    const client = rng.pick(clients);
    if (!regulars.includes(client)) regulars.push(client);
    return client;
  };

  const pickReviewBody = (rating: 2 | 3 | 4 | 5, categorySlug: string) => {
    if (rng.chance(0.3)) return null; // rating-only reviews are common
    const categoryPool = CATEGORY_REVIEWS[categorySlug as CategorySlug] ?? [];
    const pool =
      rating >= 4 && categoryPool.length && rng.chance(0.45) ? categoryPool : GENERAL_REVIEWS[rating];
    const unused = pool.filter((t) => !usedReviewTexts.has(t));
    if (!unused.length) return null;
    const text = rng.pick(unused);
    usedReviewTexts.add(text);
    return fillTemplate(text, { artist: artistFirstName });
  };

  const makeBooking = (
    date: LocalDate,
    status: NewBooking["status"],
  ): NewBooking | null => {
    const service = rng.pick(options.services);
    const slot = findSlot(
      rng,
      date,
      service.durationMinutes,
      options.availability,
      timezone,
      occupied,
    );
    if (!slot) return null;
    occupied.push(slot);

    const client = pickClient();
    const atClient = fixture.travelsToClient && (!fixture.offersStudio || rng.chance(0.5));
    const startsAt = new Date(slot.start);
    // Booked between 2 and 35 days ahead, but never "created" in the future.
    const createdAt = new Date(
      Math.min(now.getTime() - 3_600_000, slot.start - rng.int(2, 35) * 86_400_000),
    );

    return {
      id: crypto.randomUUID(),
      reference: bookingReference(rng),
      clientId: client.id,
      artistId,
      serviceId: service.id,
      status,
      startsAt,
      endsAt: new Date(slot.end),
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      location: atClient ? "client" : "studio",
      address: atClient ? rng.pick(CLIENT_ADDRESSES) : null,
      notes: rng.chance(0.3) ? rng.pick(BOOKING_NOTES) : null,
      cancelledBy: status === "cancelled" ? (rng.chance(0.7) ? "client" : "artist") : null,
      cancellationReason:
        status === "cancelled"
          ? rng.pick(["Change of plans", "Event was postponed", "Feeling unwell", "Scheduling conflict"])
          : null,
      createdAt,
      updatedAt: createdAt,
    };
  };

  const today = toLocalDate(now, timezone);

  // Past: mostly completed, with the usual cancellations and declines.
  for (let offset = options.pastDays; offset >= 1; offset--) {
    const date = addDays(today, -offset);
    let expected = perWorkingDay;
    while (expected > 0) {
      if (!rng.chance(Math.min(1, expected))) break;
      expected -= 1;

      const roll = rng.next();
      const status: NewBooking["status"] =
        roll < 0.88
          ? "completed"
          : roll < 0.95
            ? "cancelled"
            : fixture.instantBook
              ? "cancelled"
              : "declined";
      const booking = makeBooking(date, status);
      if (!booking) break;

      if (status !== "completed") {
        // Cancelled/declined bookings free up the calendar again.
        occupied.pop();
      }
      bookingRows.push(booking);

      if (status === "completed" && rng.chance(0.72)) {
        const rating = ratingFor(rng, fixture.quality);
        const service = options.services.find((s) => s.id === booking.serviceId)!;
        const createdAt = new Date(booking.endsAt.getTime() + rng.int(4, 120) * 3_600_000);
        if (createdAt > now) continue;
        const clientName = clients.find((c) => c.id === booking.clientId)!.name.split(" ")[0];
        const replies = rating >= 4 ? ARTIST_REPLIES.positive : ARTIST_REPLIES.critical;
        const replyChance = rating >= 4 ? fixture.replyRate : Math.min(1, fixture.replyRate + 0.3);
        const replied = rng.chance(replyChance);
        reviewRows.push({
          bookingId: booking.id,
          artistId,
          authorId: booking.clientId,
          rating,
          body: pickReviewBody(rating, service.categorySlug),
          artistReply: replied ? fillTemplate(rng.pick(replies), { client: clientName }) : null,
          artistRepliedAt: replied
            ? new Date(Math.min(now.getTime(), createdAt.getTime() + rng.int(2, 48) * 3_600_000))
            : null,
          createdAt,
        });
      }
    }
  }

  // Future: confirmed bookings plus a few requests waiting on the artist.
  const futureFill = options.futureFill ?? 0.35;
  for (let offset = 1; offset <= options.futureDays; offset++) {
    const date = addDays(today, offset);
    // Calendars fill up less the further out you look.
    const decay = Math.max(0.25, 1 - offset / (options.futureDays * 1.2));
    let expected = perWorkingDay * (1 + futureFill) * decay;
    while (expected > 0) {
      if (!rng.chance(Math.min(1, expected))) break;
      expected -= 1;
      const status = !fixture.instantBook && offset <= 21 && rng.chance(0.2) ? "requested" : "confirmed";
      const booking = makeBooking(date, status);
      if (!booking) break;
      if (status === "requested") {
        // Artists answer within a day, so open requests are always recent.
        booking.createdAt = booking.updatedAt = new Date(now.getTime() - rng.int(1, 30) * 3_600_000);
      }
      bookingRows.push(booking);
    }
  }

  return { bookings: bookingRows, reviews: reviewRows };
}
