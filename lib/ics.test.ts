import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "abc@lumine",
    start: new Date("2026-10-15T15:30:00Z"),
    end: new Date("2026-10-15T16:30:00Z"),
    title: "Soft Glam with Selene Hartwell",
    description: "Booking LUM-ABC123; bring your outfit, please\nThanks",
    location: "155 Montague St, Brooklyn, NY 11201",
    url: "https://example.com/account/bookings/LUM-ABC123",
  });

  it("uses CRLF line endings and UTC timestamps", () => {
    expect(ics).toContain("\r\nDTSTART:20261015T153000Z\r\n");
    expect(ics).toContain("\r\nDTEND:20261015T163000Z\r\n");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });

  it("escapes commas, semicolons and newlines", () => {
    expect(ics).toContain("LOCATION:155 Montague St\\, Brooklyn\\, NY 11201");
    expect(ics).toContain("DESCRIPTION:Booking LUM-ABC123\; bring your outfit\\, please\\nThanks");
  });

  it("folds long lines", () => {
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});
