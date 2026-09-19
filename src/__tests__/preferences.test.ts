import { describe, expect, it } from "vitest";
import { moviePreferenceSchema, preferenceWeight } from "../lib/preferences";

describe("movie preferences", () => {
  it("accepts half-star ratings for viewed movies", () => {
    expect(moviePreferenceSchema.safeParse({ viewed: true, rating: 3.5 }).success).toBe(true);
  });

  it("rejects ratings for unviewed movies", () => {
    expect(moviePreferenceSchema.safeParse({ viewed: false, rating: 4 }).success).toBe(false);
  });

  it("weights likes and ratings for transparent recommendations", () => {
    expect(preferenceWeight(true, 4.5)).toBe(2.9);
  });
});