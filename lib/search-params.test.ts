import { describe, expect, it } from "vitest";
import { countRefinements, parseSearchParams, toQueryString } from "./search-params";

describe("search params", () => {
  it("parses a full query", () => {
    const f = parseSearchParams(
      new URLSearchParams("q=glam&category=bridal-makeup&area=Brooklyn,Queens&maxPrice=300&minRating=4.5&date=2026-10-10&instant=1&location=client&sort=rating"),
    );
    expect(f).toEqual({
      q: "glam",
      category: "bridal-makeup",
      area: ["Brooklyn", "Queens"],
      maxPrice: 300,
      minRating: 4.5,
      date: "2026-10-10",
      instant: true,
      location: "client",
      sort: "rating",
    });
    expect(countRefinements(f)).toBe(7);
  });

  it("falls back to defaults on junk instead of throwing", () => {
    const f = parseSearchParams({
      area: "Narnia,Brooklyn",
      maxPrice: "-5",
      date: "tomorrow",
      sort: "random",
      location: "moon",
      instant: "yes",
      q: "   ",
    });
    expect(f).toMatchObject({ area: ["Brooklyn"], sort: "recommended", instant: false, q: undefined });
    expect(f.maxPrice).toBeUndefined();
    expect(f.date).toBeUndefined();
    expect(f.location).toBeUndefined();
  });

  it("round-trips through the query string, omitting defaults", () => {
    const qs = toQueryString({ category: "bridal-makeup", area: ["Brooklyn"], sort: "recommended", instant: true });
    expect(qs).toBe("?category=bridal-makeup&area=Brooklyn&instant=1");
    expect(toQueryString(parseSearchParams(new URLSearchParams(qs.slice(1))))).toBe(qs);
    expect(toQueryString({ sort: "recommended", area: [] })).toBe("");
  });
});
