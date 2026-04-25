import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { matchesFilters } from "./search-match";
import type { PropertyListItem, SearchFilters } from "@/types";

// Base listing factory
function makeListing(
  overrides: Partial<PropertyListItem> = {},
): PropertyListItem {
  return {
    id: "test-id",
    title: "Test Apartment",
    price: 50000,
    price_type: "rent",
    type: "one_bedroom",
    location: "Westlands, Nairobi",
    neighborhood: "Westlands",
    latitude: -1.2641,
    longitude: 36.8028,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 500,
    images: [],
    availability_status: "available",
    listing_status: "published",
    ...overrides,
  };
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

describe("matchesFilters — unit tests", () => {
  it("returns true for empty filters", () => {
    expect(matchesFilters(makeListing(), {})).toBe(true);
  });

  it("filters by text query (title match)", () => {
    const listing = makeListing({
      title: "Cozy Studio in Kilimani",
      location: "Kilimani, Nairobi",
      neighborhood: "Kilimani",
    });
    expect(matchesFilters(listing, { q: "kilimani" })).toBe(true);
    expect(matchesFilters(listing, { q: "parklands" })).toBe(false);
  });

  it("filters by text query (location match)", () => {
    const listing = makeListing({ location: "Kilimani, Nairobi" });
    expect(matchesFilters(listing, { q: "kilimani" })).toBe(true);
  });

  it("filters by min_price", () => {
    const listing = makeListing({ price: 30000 });
    expect(matchesFilters(listing, { min_price: 25000 })).toBe(true);
    expect(matchesFilters(listing, { min_price: 35000 })).toBe(false);
  });

  it("filters by max_price", () => {
    const listing = makeListing({ price: 30000 });
    expect(matchesFilters(listing, { max_price: 35000 })).toBe(true);
    expect(matchesFilters(listing, { max_price: 25000 })).toBe(false);
  });

  it("filters by price range (inclusive boundaries)", () => {
    const listing = makeListing({ price: 30000 });
    expect(
      matchesFilters(listing, { min_price: 30000, max_price: 30000 }),
    ).toBe(true);
  });

  it("filters by property type", () => {
    const listing = makeListing({ type: "studio" });
    expect(matchesFilters(listing, { type: "studio" })).toBe(true);
    expect(matchesFilters(listing, { type: "villa" })).toBe(false);
  });

  it("filters by price_type", () => {
    const listing = makeListing({ price_type: "rent" });
    expect(matchesFilters(listing, { price_type: "rent" })).toBe(true);
    expect(matchesFilters(listing, { price_type: "sale" })).toBe(false);
  });

  it("filters by bedrooms (exact match below cap)", () => {
    const listing = makeListing({ bedrooms: 2 });
    expect(matchesFilters(listing, { bedrooms: 2 })).toBe(true);
    expect(matchesFilters(listing, { bedrooms: 3 })).toBe(false);
  });

  it("filters by bedrooms (5+ cap)", () => {
    const listing = makeListing({ bedrooms: 6 });
    expect(matchesFilters(listing, { bedrooms: 5 })).toBe(true);
    const listing4 = makeListing({ bedrooms: 4 });
    expect(matchesFilters(listing4, { bedrooms: 5 })).toBe(false);
  });

  it("filters by bathrooms (exact match below cap)", () => {
    const listing = makeListing({ bathrooms: 2 });
    expect(matchesFilters(listing, { bathrooms: 2 })).toBe(true);
    expect(matchesFilters(listing, { bathrooms: 1 })).toBe(false);
  });

  it("filters by price_per_sqft range", () => {
    // price=50000, sqft=500 → ppsf=100
    const listing = makeListing({ price: 50000, sqft: 500 });
    expect(
      matchesFilters(listing, {
        min_price_per_sqft: 90,
        max_price_per_sqft: 110,
      }),
    ).toBe(true);
    expect(matchesFilters(listing, { min_price_per_sqft: 110 })).toBe(false);
    expect(matchesFilters(listing, { max_price_per_sqft: 90 })).toBe(false);
  });

  it("skips price_per_sqft filter when sqft is 0", () => {
    const listing = makeListing({ price: 50000, sqft: 0 });
    // sqft=0 means ppsf filter is skipped → listing passes
    expect(matchesFilters(listing, { min_price_per_sqft: 1000 })).toBe(true);
  });

  it("filters by geo radius", () => {
    // Listing at Westlands (-1.2641, 36.8028)
    const listing = makeListing({ latitude: -1.2641, longitude: 36.8028 });
    // Same point → distance 0 → within any radius
    expect(
      matchesFilters(listing, { lat: -1.2641, lng: 36.8028, radius_km: 1 }),
    ).toBe(true);
    // Point ~50km away → outside 1km radius
    expect(
      matchesFilters(listing, { lat: -1.7, lng: 36.8028, radius_km: 1 }),
    ).toBe(false);
  });
});

// ─── Property-based tests ─────────────────────────────────────────────────────

// Feature: cribke-improvements, Property 8: Price-per-sqft filter correctness
describe("matchesFilters — Property 8: Price-per-sqft filter correctness", () => {
  it("every listing passing the filter satisfies the ppsf range", () => {
    const listingArb = fc.record({
      id: fc.constant("id"),
      title: fc.constant("T"),
      price: fc.integer({ min: 1, max: 10_000_000 }),
      price_type: fc.constantFrom("rent" as const, "sale" as const),
      type: fc.constantFrom("studio" as const, "one_bedroom" as const),
      location: fc.constant("Nairobi"),
      neighborhood: fc.constant("CBD"),
      latitude: fc.float({ min: -4, max: 4, noNaN: true }),
      longitude: fc.float({ min: 33, max: 42, noNaN: true }),
      bedrooms: fc.integer({ min: 0, max: 10 }),
      bathrooms: fc.integer({ min: 0, max: 10 }),
      sqft: fc.integer({ min: 1, max: 5000 }),
      images: fc.constant([]),
      availability_status: fc.constantFrom("available" as const),
      listing_status: fc.constantFrom("published" as const),
    });

    const filterArb = fc
      .record({
        min_price_per_sqft: fc.integer({ min: 0, max: 500 }),
        max_price_per_sqft: fc.integer({ min: 0, max: 500 }),
      })
      .filter((f) => f.min_price_per_sqft <= f.max_price_per_sqft);

    fc.assert(
      fc.property(listingArb, filterArb, (listing, filters) => {
        const passes = matchesFilters(listing, filters);
        if (passes && listing.sqft > 0) {
          const ppsf = listing.price / listing.sqft;
          return (
            (filters.min_price_per_sqft === undefined ||
              ppsf >= filters.min_price_per_sqft) &&
            (filters.max_price_per_sqft === undefined ||
              ppsf <= filters.max_price_per_sqft)
          );
        }
        return true;
      }),
      { numRuns: 200 },
    );
  });

  it("no listing outside the ppsf range passes the filter", () => {
    const listingArb = fc.record({
      id: fc.constant("id"),
      title: fc.constant("T"),
      price: fc.integer({ min: 1, max: 10_000_000 }),
      price_type: fc.constantFrom("rent" as const, "sale" as const),
      type: fc.constantFrom("studio" as const, "one_bedroom" as const),
      location: fc.constant("Nairobi"),
      neighborhood: fc.constant("CBD"),
      latitude: fc.float({ min: -4, max: 4, noNaN: true }),
      longitude: fc.float({ min: 33, max: 42, noNaN: true }),
      bedrooms: fc.integer({ min: 0, max: 10 }),
      bathrooms: fc.integer({ min: 0, max: 10 }),
      sqft: fc.integer({ min: 1, max: 5000 }),
      images: fc.constant([]),
      availability_status: fc.constantFrom("available" as const),
      listing_status: fc.constantFrom("published" as const),
    });

    fc.assert(
      fc.property(listingArb, (listing) => {
        const ppsf = listing.price / listing.sqft;
        // Set a range that excludes this listing's ppsf
        const filters: SearchFilters = {
          min_price_per_sqft: Math.ceil(ppsf) + 1,
          max_price_per_sqft: Math.ceil(ppsf) + 100,
        };
        return matchesFilters(listing, filters) === false;
      }),
      { numRuns: 200 },
    );
  });
});

// Feature: cribke-improvements, Property 1: Listing visibility follows status
describe("matchesFilters — Property 1: Listing visibility follows status (pure filter logic)", () => {
  it("matchesFilters does not filter by listing_status (that is a DB concern)", () => {
    // The pure matchesFilters function doesn't check listing_status —
    // that filtering happens at the DB query level. This test documents that.
    const draftListing = makeListing({ listing_status: "draft" });
    const publishedListing = makeListing({ listing_status: "published" });
    // Both pass empty filters — status filtering is DB-level
    expect(matchesFilters(draftListing, {})).toBe(true);
    expect(matchesFilters(publishedListing, {})).toBe(true);
  });
});
