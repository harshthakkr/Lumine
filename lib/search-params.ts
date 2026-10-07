import { z } from "zod";

// The discovery page's state lives entirely in the URL, so every search is
// shareable and the back button works. This module is the single source of
// truth for parsing and serializing it, on both server and client.

export const SORTS = {
  recommended: "Recommended",
  rating: "Top rated",
  reviews: "Most reviewed",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
} as const;
export type Sort = keyof typeof SORTS;

export const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Jersey City"] as const;
export type Borough = (typeof BOROUGHS)[number];

export const PRICE_STEPS = [100, 150, 200, 300, 500] as const;
export const RATING_STEPS = [4.5, 4.0] as const;

const csv = <T extends string>(allowed: readonly T[]) =>
  z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is T => (allowed as readonly string[]).includes(s)),
    );

const optionalNumber = z.coerce.number().positive().optional().catch(undefined);

export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .catch(undefined)
    .transform((v) => v || undefined),
  category: z.string().max(60).optional().catch(undefined),
  area: csv(BOROUGHS),
  maxPrice: optionalNumber,
  minRating: optionalNumber,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  instant: z
    .literal("1")
    .optional()
    .catch(undefined)
    .transform((v) => v === "1"),
  location: z.enum(["studio", "client"]).optional().catch(undefined),
  sort: z
    .enum(Object.keys(SORTS) as [Sort, ...Sort[]])
    .optional()
    .catch(undefined)
    .transform((v) => v ?? "recommended"),
});

export type SearchFilters = z.output<typeof searchSchema>;

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function parseSearchParams(raw: RawParams): SearchFilters {
  const flat: Record<string, string | undefined> = {};
  if (raw instanceof URLSearchParams) {
    raw.forEach((value, key) => (flat[key] = value));
  } else {
    for (const [key, value] of Object.entries(raw)) flat[key] = Array.isArray(value) ? value[0] : value;
  }
  return searchSchema.parse(flat);
}

/** Serialize filters back to a query string, omitting defaults. */
export function toQueryString(filters: Partial<SearchFilters>) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.area?.length) params.set("area", filters.area.join(","));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.date) params.set("date", filters.date);
  if (filters.instant) params.set("instant", "1");
  if (filters.location) params.set("location", filters.location);
  if (filters.sort && filters.sort !== "recommended") params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Number of active filters, excluding search text, category and sort. */
export function countRefinements(f: SearchFilters) {
  return (
    f.area.length +
    (f.maxPrice ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.date ? 1 : 0) +
    (f.instant ? 1 : 0) +
    (f.location ? 1 : 0)
  );
}
