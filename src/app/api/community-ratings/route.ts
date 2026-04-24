import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import type { AreaDimension, CommunityRating } from "@/types";

const AREA_DIMENSIONS = [
  "safety",
  "water",
  "commute",
  "internet",
  "flooding",
] as const;

// Maps AreaDimension to the corresponding column in the areas table — kept for reference
// (not used in SQL; CASE expression used instead to avoid dynamic identifiers)

const postSchema = z.object({
  area_id: z.string().uuid(),
  dimension: z.enum(AREA_DIMENSIONS),
  value: z.number().int().min(1).max(10),
});

// GET /api/community-ratings?area_id=uuid
export async function GET(request: NextRequest) {
  try {
    const areaId = request.nextUrl.searchParams.get("area_id");

    if (!areaId) {
      return Response.json(
        { error: "area_id query param is required" },
        { status: 400 },
      );
    }

    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(areaId).success) {
      return Response.json(
        { error: "area_id must be a valid UUID" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT
        dimension,
        ROUND(AVG(value)::numeric, 1) AS avg,
        COUNT(*)::int                 AS count
      FROM community_ratings
      WHERE area_id = ${areaId}::uuid
      GROUP BY dimension
      ORDER BY dimension
    `;

    const data = rows.map((r) => ({
      dimension: r.dimension as AreaDimension,
      avg: Number(r.avg),
      count: Number(r.count),
    }));

    return Response.json({ data });
  } catch (err) {
    console.error("GET /api/community-ratings error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/community-ratings
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { area_id, dimension, value } = parsed.data;

    // Check for an existing rating within the last 30 days (Requirement 5.4)
    const existing = await sql`
      SELECT created_at
      FROM community_ratings
      WHERE user_id  = ${user.id}::uuid
        AND area_id  = ${area_id}::uuid
        AND dimension = ${dimension}::area_dimension
        AND created_at > NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (existing.length > 0) {
      const lastSubmitted = new Date(existing[0].created_at as string);
      const retryAfter = new Date(
        lastSubmitted.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      return Response.json(
        {
          error: "Rate limited",
          message: `You may submit another rating for this dimension after ${retryAfter.toLocaleDateString("en-KE", { dateStyle: "long" })}`,
          retry_after: retryAfter.toISOString(),
        },
        { status: 429 },
      );
    }

    // INSERT rating then UPDATE areas score (Requirement 5.3, 5.5)
    const insertResult = await sql`
      INSERT INTO community_ratings (user_id, area_id, dimension, value)
      VALUES (${user.id}::uuid, ${area_id}::uuid, ${dimension}::area_dimension, ${value})
      RETURNING id, user_id, area_id, dimension, value, created_at
    `;

    // Update the areas table score using a CASE expression to avoid dynamic column names.
    // The avg subquery is scoped to the same area_id + dimension.
    await sql`
      UPDATE areas
      SET
        safety_score   = CASE WHEN ${dimension} = 'safety'   THEN (SELECT ROUND(AVG(cr.value)::numeric,1) FROM community_ratings cr WHERE cr.area_id=${area_id}::uuid AND cr.dimension='safety'::area_dimension)   ELSE safety_score   END,
        water_score    = CASE WHEN ${dimension} = 'water'    THEN (SELECT ROUND(AVG(cr.value)::numeric,1) FROM community_ratings cr WHERE cr.area_id=${area_id}::uuid AND cr.dimension='water'::area_dimension)    ELSE water_score    END,
        commute_score  = CASE WHEN ${dimension} = 'commute'  THEN (SELECT ROUND(AVG(cr.value)::numeric,1) FROM community_ratings cr WHERE cr.area_id=${area_id}::uuid AND cr.dimension='commute'::area_dimension)  ELSE commute_score  END,
        internet_score = CASE WHEN ${dimension} = 'internet' THEN (SELECT ROUND(AVG(cr.value)::numeric,1) FROM community_ratings cr WHERE cr.area_id=${area_id}::uuid AND cr.dimension='internet'::area_dimension) ELSE internet_score END,
        flooding_score = CASE WHEN ${dimension} = 'flooding' THEN (SELECT ROUND(AVG(cr.value)::numeric,1) FROM community_ratings cr WHERE cr.area_id=${area_id}::uuid AND cr.dimension='flooding'::area_dimension) ELSE flooding_score END,
        updated_at     = NOW()
      WHERE id = ${area_id}::uuid
    `;

    const row = insertResult[0] as Record<string, unknown>;
    const rating: CommunityRating = {
      id: row.id as string,
      user_id: row.user_id as string,
      area_id: row.area_id as string,
      dimension: row.dimension as AreaDimension,
      value: row.value as number,
      created_at: row.created_at as string,
    };

    return Response.json({ data: rating }, { status: 201 });
  } catch (err) {
    console.error("POST /api/community-ratings error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
