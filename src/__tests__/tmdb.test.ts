import { describe, expect, it } from "vitest";
import { tmdbImage } from "../lib/tmdb";

describe("TMDB provider adapter", () => {
  it("builds a secure image URL from a provider path", () => {
    expect(tmdbImage("/poster.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/poster.jpg");
  });

  it("returns null for missing artwork", () => {
    expect(tmdbImage(null)).toBeNull();
  });
});