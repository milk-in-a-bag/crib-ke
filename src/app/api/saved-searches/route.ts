import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import type { SavedSearch, SearchFilters } from "@/types";

const savedSearchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  filters: z.object({
    q: z.string().optional(),
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    min_price_per_sqft: z.number().optional(),
    max_price_per_sqft: z.number().optional(),
    type: z
      .enum([
        "bedsitter",
        "one_bedroom",
        "two_bedroom",
        "three_bedroom",
        "studio",
        "villa",
        "townhouse",
      ])
      .optional(),
    price_type: z.enum(["rent", "sale"]).optional(),
    amenities: z.array(z.string()).optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    radius_km: z.number().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    sort: z
      .enum(["newest", "price_asc", "price_desc", "best_match", "distance"])
      .optional(),
  }),
});

export async function GET(_request: NextRequest) {
  try {
    const authResult = await requireRole("seeker");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const rows = await sql`
      SELECT id, user_id, name, filters, created_at
      FROM saved_searches
      WHERE user_id = ${user.id}::uuid
      ORDER BY created_at DESC
    `;

    const data: SavedSearch[] = rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      name: r.name as string,
      filters: r.filters as SearchFilters,
      created_at: r.created_at as string,
    }));

    return Response.json({ data });
  } catch (err) {
    console.error("GET /api/saved-searches error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole("seeker");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = savedSearchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    // Check limit: max 10 saved searches per seeker
    const countResult = await sql`
      SELECT COUNT(*) AS total FROM saved_searches WHERE user_id = ${user.id}::uuid
    `;
    const count = Number(countResult[0]?.total ?? 0);
    if (count >= 10) {
      return Response.json(
        {
          error: "Saved search limit reached",
          details:
            "You can save a maximum of 10 searches. Please delete an existing one before saving a new search.",
        },
        { status: 422 },
      );
    }

    const { name, filters } = parsed.data;
    const result = await sql`
      INSERT INTO saved_searches (user_id, name, filters)
      VALUES (${user.id}::uuid, ${name}, ${JSON.stringify(filters)}::jsonb)
      RETURNING id, user_id, name, filters, created_at
    `;

    const row = result[0];
    const savedSearch: SavedSearch = {
      id: row.id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      filters: row.filters as SearchFilters,
      created_at: row.created_at as string,
    };

    return Response.json({ data: savedSearch }, { status: 201 });
  } catch (err) {
    console.error("POST /api/saved-searches error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
