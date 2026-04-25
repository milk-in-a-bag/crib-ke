import type { PropertyListItem, SearchFilters } from "@/types";

/**
 * Pure function — no I/O, no side effects.
 * Returns true if the listing satisfies every active filter in `filters`.
 */
export function matchesFilters(
  listing: PropertyListItem,
  filters: SearchFilters,
): boolean {
  // Text search: title, location, or neighborhood
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [listing.title, listing.location, listing.neighborhood]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  // Price range
  if (filters.min_price !== undefined && listing.price < filters.min_price) {
    return false;
  }
  if (filters.max_price !== undefined && listing.price > filters.max_price) {
    return false;
  }

  // Price per sqft
  if (
    (filters.min_price_per_sqft !== undefined ||
      filters.max_price_per_sqft !== undefined) &&
    listing.sqft > 0
  ) {
    const ppsf = listing.price / listing.sqft;
    if (
      filters.min_price_per_sqft !== undefined &&
      ppsf < filters.min_price_per_sqft
    ) {
      return false;
    }
    if (
      filters.max_price_per_sqft !== undefined &&
      ppsf > filters.max_price_per_sqft
    ) {
      return false;
    }
  }

  // Property type
  if (filters.type && listing.type !== filters.type) return false;

  // Price type (rent / sale)
  if (filters.price_type && listing.price_type !== filters.price_type) {
    return false;
  }

  // Bedrooms
  if (filters.bedrooms !== undefined) {
    const cap = Math.min(filters.bedrooms, 5);
    if (cap >= 5) {
      if (listing.bedrooms < 5) return false;
    } else {
      if (listing.bedrooms !== cap) return false;
    }
  }

  // Bathrooms
  if (filters.bathrooms !== undefined) {
    const cap = Math.min(filters.bathrooms, 5);
    if (cap >= 5) {
      if (listing.bathrooms < 5) return false;
    } else {
      if (listing.bathrooms !== cap) return false;
    }
  }

  // Geo radius (Haversine)
  if (
    filters.radius_km !== undefined &&
    filters.lat !== undefined &&
    filters.lng !== undefined
  ) {
    const dist = haversineKm(
      filters.lat,
      filters.lng,
      listing.latitude,
      listing.longitude,
    );
    if (dist > filters.radius_km) return false;
  }

  return true;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
