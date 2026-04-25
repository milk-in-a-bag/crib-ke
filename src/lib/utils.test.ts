import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getScoreColor, formatPrice } from "./utils";

// ─── getScoreColor unit tests ─────────────────────────────────────────────────

describe("getScoreColor", () => {
  it("returns green class for score >= 7", () => {
    expect(getScoreColor(7)).toBe("text-emerald-500");
    expect(getScoreColor(10)).toBe("text-emerald-500");
    expect(getScoreColor(7.5)).toBe("text-emerald-500");
  });

  it("returns amber class for score >= 4 and < 7", () => {
    expect(getScoreColor(4)).toBe("text-amber-500");
    expect(getScoreColor(6.9)).toBe("text-amber-500");
    expect(getScoreColor(5)).toBe("text-amber-500");
  });

  it("returns red class for score < 4", () => {
    expect(getScoreColor(0)).toBe("text-rose-500");
    expect(getScoreColor(3.9)).toBe("text-rose-500");
    expect(getScoreColor(1)).toBe("text-rose-500");
  });

  // Property: every score in [0,10] maps to exactly one colour class
  it("always returns one of the three colour classes", () => {
    const validClasses = new Set([
      "text-emerald-500",
      "text-amber-500",
      "text-rose-500",
    ]);
    fc.assert(
      fc.property(fc.float({ min: 0, max: 10, noNaN: true }), (score) => {
        return validClasses.has(getScoreColor(score));
      }),
      { numRuns: 500 },
    );
  });

  // Property: thresholds are respected for all inputs
  it("respects thresholds: >=7 green, >=4 amber, <4 red", () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 10, noNaN: true }), (score) => {
        const color = getScoreColor(score);
        if (score >= 7) return color === "text-emerald-500";
        if (score >= 4) return color === "text-amber-500";
        return color === "text-rose-500";
      }),
      { numRuns: 500 },
    );
  });
});

// ─── formatPrice unit tests ───────────────────────────────────────────────────

describe("formatPrice", () => {
  it("formats rent prices with /mo suffix", () => {
    expect(formatPrice(45000, "rent")).toBe("KES 45,000/mo");
  });

  it("formats sale prices without suffix", () => {
    expect(formatPrice(850000, "sale")).toBe("KES 850,000");
  });

  it("formats millions with M suffix", () => {
    expect(formatPrice(12_500_000, "sale")).toBe("KES 12.5M");
    expect(formatPrice(5_000_000, "sale")).toBe("KES 5M");
  });

  it("formats million rent prices with M and /mo", () => {
    expect(formatPrice(2_000_000, "rent")).toBe("KES 2M/mo");
  });

  // Property: output always starts with "KES "
  it("always starts with KES prefix", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        fc.constantFrom("rent" as const, "sale" as const),
        (price, priceType) => {
          return formatPrice(price, priceType).startsWith("KES ");
        },
      ),
      { numRuns: 200 },
    );
  });

  // Property: rent prices always end with /mo
  it("rent prices always end with /mo", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000_000 }), (price) => {
        return formatPrice(price, "rent").endsWith("/mo");
      }),
      { numRuns: 200 },
    );
  });

  // Property: sale prices never end with /mo
  it("sale prices never end with /mo", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000_000 }), (price) => {
        return !formatPrice(price, "sale").endsWith("/mo");
      }),
      { numRuns: 200 },
    );
  });
});
