import type { Route } from "next";

// Every internal URL in one place, so the site map is easy to see and change.

export type Role = "client" | "artist";

export const routes = {
  home: "/" as Route,
  browse: "/artists" as Route,
  artist: (slug: string) => `/artists/${slug}` as Route,
  book: (slug: string, serviceId: string, start: string) =>
    `/book/${slug}?service=${serviceId}&start=${encodeURIComponent(start)}` as Route,
  bookings: "/bookings" as Route,
  booking: (reference: string) => `/bookings/${reference}` as Route,
  bookingCalendar: (reference: string) => `/bookings/${reference}/calendar`,
  saved: "/saved" as Route,
  dashboard: "/dashboard" as Route,
  signIn: (next?: string) => (next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in") as Route,
  signUp: "/sign-up" as Route,
  /** Where a signed-in user "lives". */
  homeFor: (role: Role) => (role === "artist" ? "/dashboard" : "/artists") as Route,
};
