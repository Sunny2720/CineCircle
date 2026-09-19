import { describe, expect, it } from "vitest";

function makeSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

describe("playlist input", () => {
  it("creates a URL-safe base slug", () => {
    expect(makeSlug("Rainy Night Cinema!")).toBe("rainy-night-cinema");
  });
});