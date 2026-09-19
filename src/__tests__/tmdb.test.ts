import { describe, expect, it } from "vitest";
import { tmdbImage, tmdbTrailerUrl } from "../lib/tmdb";

describe("TMDB provider adapter", () => {
  it("builds a secure image URL from a provider path", () => {
    expect(tmdbImage("/poster.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/poster.jpg");
  });

  it("returns null for missing artwork", () => {
    expect(tmdbImage(null)).toBeNull();
  });

  it("prefers an official YouTube trailer", () => {
    const movie = { videos: { results: [
      { key: "backup", site: "YouTube", type: "Trailer", official: false },
      { key: "official", site: "YouTube", type: "Trailer", official: true },
    ] } } as Parameters<typeof tmdbTrailerUrl>[0];

    expect(tmdbTrailerUrl(movie)).toBe("https://www.youtube.com/watch?v=official");
  });

  it("falls back to a non-official YouTube trailer", () => {
    const movie = { videos: { results: [
      { key: "teaser", site: "YouTube", type: "Teaser", official: true },
      { key: "trailer", site: "YouTube", type: "Trailer", official: false },
    ] } } as Parameters<typeof tmdbTrailerUrl>[0];

    expect(tmdbTrailerUrl(movie)).toBe("https://www.youtube.com/watch?v=trailer");
  });

  it("returns null when no YouTube trailer is available", () => {
    const movie = { videos: { results: [
      { key: "vimeo", site: "Vimeo", type: "Trailer", official: true },
    ] } } as Parameters<typeof tmdbTrailerUrl>[0];

    expect(tmdbTrailerUrl(movie)).toBeNull();
  });
});