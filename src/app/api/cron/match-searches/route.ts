import { type NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { matchesFilters } from "@/lib/search-match";
import type { PropertyListItem, SavedSearch, SearchFilters } from "@/types";

export async function GET(request: NextRequest) {
  // Auth: verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Listings published in the last 2 minutes
    const listingRows = await sql`
      SELECT
        id, title, price, price_type, type,
        location, neighborhood, latitude, longitude,
        bedrooms, bathrooms, sqft, images,
        availability_status, listing_status, published_at
      FROM properties
      WHERE listing_status = 'published'
        AND published_at > NOW() - INTERVAL '2 minutes'
        AND deleted_at IS NULL
    `;

    const listings: PropertyListItem[] = listingRows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      price: r.price as number,
      price_type: r.price_type as PropertyListItem["price_type"],
      type: r.type as PropertyListItem["type"],
      location: r.location as string,
      neighborhood: r.neighborhood as string,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      bedrooms: r.bedrooms as number,
      bathrooms: r.bathrooms as number,
      sqft: r.sqft as number,
      images: (r.images as string[]) ?? [],
      availability_status:
        r.availability_status as PropertyListItem["availability_status"],
      listing_status: r.listing_status as PropertyListItem["listing_status"],
      published_at: r.published_at as string | undefined,
    }));

    if (listings.length === 0) {
      return Response.json({ matched: 0, listings_checked: 0 });
    }

    // All saved searches
    const searchRows = await sql`
      SELECT id, user_id, name, filters
      FROM saved_searches
    `;

    const savedSearches: SavedSearch[] = searchRows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      name: r.name as string,
      filters: r.filters as SearchFilters,
      created_at: r.created_at as string,
    }));

    let matched = 0;

    for (const listing of listings) {
      for (const search of savedSearches) {
        if (!matchesFilters(listing, search.filters)) continue;

        const link = `/property/${listing.id}`;
        const title = "New listing matches your search";
        const body = `"${listing.title}" in ${listing.neighborhood} matches your saved search "${search.name}".`;

        // ON CONFLICT DO NOTHING via the UNIQUE(user_id, type, link) partial index
        await sql`
          INSERT INTO notifications (user_id, type, title, body, read, link)
          VALUES (
            ${search.user_id}::uuid,
            'new_listing_match'::notification_type,
            ${title},
            ${body},
            FALSE,
            ${link}
          )
          ON CONFLICT DO NOTHING
        `;

        matched++;
      }
    }

    return Response.json({ matched, listings_checked: listings.length });
  } catch (err) {
    console.error("GET /api/cron/match-searches error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
