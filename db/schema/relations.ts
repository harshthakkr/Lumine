import { relations } from "drizzle-orm";
import { accounts, demoWorkspaces, sessions, users } from "./auth";
import {
  artistCategories,
  artistProfiles,
  availabilityRules,
  bookings,
  categories,
  favorites,
  portfolioImages,
  reviews,
  services,
  timeOff,
} from "./marketplace";

export const demoWorkspacesRelations = relations(demoWorkspaces, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  demoWorkspace: one(demoWorkspaces, {
    fields: [users.demoWorkspaceId],
    references: [demoWorkspaces.id],
  }),
  artistProfile: one(artistProfiles),
  sessions: many(sessions),
  accounts: many(accounts),
  bookings: many(bookings),
  reviews: many(reviews),
  favorites: many(favorites),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  artists: many(artistCategories),
  services: many(services),
}));

export const artistProfilesRelations = relations(artistProfiles, ({ one, many }) => ({
  user: one(users, { fields: [artistProfiles.userId], references: [users.id] }),
  categories: many(artistCategories),
  services: many(services),
  portfolio: many(portfolioImages),
  availability: many(availabilityRules),
  timeOff: many(timeOff),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const artistCategoriesRelations = relations(artistCategories, ({ one }) => ({
  artist: one(artistProfiles, {
    fields: [artistCategories.artistId],
    references: [artistProfiles.id],
  }),
  category: one(categories, {
    fields: [artistCategories.categorySlug],
    references: [categories.slug],
  }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  artist: one(artistProfiles, { fields: [services.artistId], references: [artistProfiles.id] }),
  category: one(categories, { fields: [services.categorySlug], references: [categories.slug] }),
}));

export const portfolioImagesRelations = relations(portfolioImages, ({ one }) => ({
  artist: one(artistProfiles, {
    fields: [portfolioImages.artistId],
    references: [artistProfiles.id],
  }),
}));

export const availabilityRulesRelations = relations(availabilityRules, ({ one }) => ({
  artist: one(artistProfiles, {
    fields: [availabilityRules.artistId],
    references: [artistProfiles.id],
  }),
}));

export const timeOffRelations = relations(timeOff, ({ one }) => ({
  artist: one(artistProfiles, { fields: [timeOff.artistId], references: [artistProfiles.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  client: one(users, { fields: [bookings.clientId], references: [users.id] }),
  artist: one(artistProfiles, { fields: [bookings.artistId], references: [artistProfiles.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  review: one(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  artist: one(artistProfiles, { fields: [reviews.artistId], references: [artistProfiles.id] }),
  author: one(users, { fields: [reviews.authorId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  artist: one(artistProfiles, { fields: [favorites.artistId], references: [artistProfiles.id] }),
}));
