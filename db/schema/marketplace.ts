import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { userRole, users } from "./auth";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const categories = pgTable("categories", {
  slug: text().primaryKey(),
  name: text().notNull(),
  tagline: text().notNull(),
  imageUrl: text().notNull(),
  /** Example looks shown on the landing page, e.g. "Red Carpet Glam". */
  highlights: text().array().notNull().default(sql`'{}'::text[]`),
  sortOrder: smallint().notNull().default(0),
});

export const cancellationPolicy = pgEnum("cancellation_policy", ["flexible", "moderate", "strict"]);

/** Hours before the appointment until which a cancellation is fully refunded. */
export const CANCELLATION_WINDOW_HOURS = { flexible: 24, moderate: 72, strict: 168 } as const;

export const artistProfiles = pgTable(
  "artist_profiles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text().notNull().unique(),
    displayName: text().notNull(),
    headline: text().notNull(),
    bio: text().notNull(),
    avatarUrl: text().notNull(),
    /** e.g. "Williamsburg" */
    neighborhood: text().notNull(),
    /** e.g. "Brooklyn"; used for location filtering. */
    borough: text().notNull(),
    city: text().notNull(),
    timezone: text().notNull().default("America/New_York"),
    yearsExperience: smallint().notNull(),
    languages: text().array().notNull().default(sql`'{}'::text[]`),
    instagramHandle: text(),
    offersStudio: boolean().notNull().default(true),
    travelsToClient: boolean().notNull().default(true),
    /** When false, new bookings wait for the artist to accept them. */
    instantBook: boolean().notNull().default(false),
    cancellationPolicy: cancellationPolicy().notNull().default("moderate"),
    /** Minimum notice before a booking can start. */
    leadTimeHours: smallint().notNull().default(24),
    /** How far into the future clients can book. */
    bookingWindowDays: smallint().notNull().default(60),
    isPublished: boolean().notNull().default(false),
    isVerified: boolean().notNull().default(false),
    // Denormalized from `reviews`; kept in sync in the same transaction
    // that writes a review (see lib/reviews).
    ratingAvg: numeric({ precision: 3, scale: 2, mode: "number" }),
    reviewCount: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index().on(t.isPublished),
    index().on(t.borough),
    check("artist_lead_time_non_negative", sql`${t.leadTimeHours} >= 0`),
    check("artist_booking_window_positive", sql`${t.bookingWindowDays} > 0`),
  ],
);

export const artistCategories = pgTable(
  "artist_categories",
  {
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    categorySlug: text()
      .notNull()
      .references(() => categories.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.artistId, t.categorySlug] }), index().on(t.categorySlug)],
);

export const services = pgTable(
  "services",
  {
    id: uuid().primaryKey().defaultRandom(),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    categorySlug: text()
      .notNull()
      .references(() => categories.slug),
    name: text().notNull(),
    description: text().notNull(),
    durationMinutes: smallint().notNull(),
    /** USD, in cents. */
    priceCents: integer().notNull(),
    isActive: boolean().notNull().default(true),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index().on(t.artistId),
    check("service_duration_range", sql`${t.durationMinutes} between 15 and 720`),
    check("service_price_non_negative", sql`${t.priceCents} >= 0`),
  ],
);

export const portfolioImages = pgTable(
  "portfolio_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    categorySlug: text().references(() => categories.slug, { onDelete: "set null" }),
    url: text().notNull(),
    alt: text().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    sortOrder: smallint().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.artistId, t.sortOrder)],
);

/**
 * Recurring weekly working hours, in the artist's local timezone.
 * Several rows per weekday allow split shifts (e.g. 9–12 and 14–19).
 */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid().primaryKey().defaultRandom(),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    /** 0 = Sunday … 6 = Saturday (matches Date#getDay). */
    weekday: smallint().notNull(),
    /** Minutes after local midnight. */
    startMinute: smallint().notNull(),
    endMinute: smallint().notNull(),
  },
  (t) => [
    index().on(t.artistId),
    check("availability_weekday_range", sql`${t.weekday} between 0 and 6`),
    check(
      "availability_minutes_range",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.startMinute} < ${t.endMinute}`,
    ),
  ],
);

/** One-off blocks such as holidays or a personal day. */
export const timeOff = pgTable(
  "time_off",
  {
    id: uuid().primaryKey().defaultRandom(),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    note: text(),
  },
  (t) => [
    index().on(t.artistId, t.startsAt),
    check("time_off_range", sql`${t.startsAt} < ${t.endsAt}`),
  ],
);

/**
 * awaiting_payment → requested → confirmed → completed
 *                  ↘ (instant book) confirmed
 * Side exits: declined (by artist), cancelled (by either side),
 * expired (payment hold or request timed out).
 */
export const bookingStatus = pgEnum("booking_status", [
  "awaiting_payment",
  "requested",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
  "expired",
]);

/** Statuses that occupy the artist's calendar. Mirrored in the exclusion constraint (see migrations). */
export const ACTIVE_BOOKING_STATUSES = ["awaiting_payment", "requested", "confirmed"] as const;

export const bookingLocation = pgEnum("booking_location", ["studio", "client"]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Short human-friendly reference shown to users, e.g. "LUM-7K3QX9". */
    reference: text().notNull().unique(),
    clientId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    serviceId: uuid().references(() => services.id, { onDelete: "set null" }),
    status: bookingStatus().notNull(),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    // Snapshot of the service at booking time, so later edits to the
    // service never rewrite history.
    serviceName: text().notNull(),
    durationMinutes: smallint().notNull(),
    priceCents: integer().notNull(),
    location: bookingLocation().notNull(),
    address: text(),
    notes: text(),
    /** Payment hold; an unpaid booking stops blocking the slot after this. */
    holdExpiresAt: timestamp({ withTimezone: true }),
    cancelledBy: userRole(),
    cancellationReason: text(),
    ...timestamps,
  },
  (t) => [
    index().on(t.artistId, t.startsAt),
    index().on(t.clientId, t.startsAt),
    check("booking_time_range", sql`${t.startsAt} < ${t.endsAt}`),
    check(
      "booking_address_required",
      sql`${t.location} = 'studio' or ${t.address} is not null`,
    ),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** One review per booking; this is what makes a review "verified". */
    bookingId: uuid()
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    authorId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: smallint().notNull(),
    body: text(),
    artistReply: text(),
    artistRepliedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex().on(t.bookingId),
    index().on(t.artistId, t.createdAt),
    check("review_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

/** Artists a client has saved for later. */
export const favorites = pgTable(
  "favorites",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: uuid()
      .notNull()
      .references(() => artistProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.artistId] }), index().on(t.artistId)],
);
