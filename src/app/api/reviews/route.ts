import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/rbac";
import type { DbReview } from "@/types";

const createReviewSchema = z.object({
  target_type: z.enum(["property", "area", "landlord", "caretaker"]),
  target_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const targetType = sp.get("target_type");
    const targetId = sp.get("target_id");

    if (!targetType || !targetId) {
      return Response.json(
        { error: "target_type and target_id query params are required" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT
        r.id, r.user_id, r.target_type, r.target_id,
        r.rating, r.comment, r.verified_tenant,
        r.helpful_count, r.created_at,
        u.name AS author_name,
        u.image AS author_avatar
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.target_type = ${targetType}::review_target_type
        AND r.target_id = ${targetId}::uuid
      ORDER BY r.helpful_count DESC, r.created_at DESC
    `;

    const data: DbReview[] = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      target_type: row.target_type,
      target_id: row.target_id,
      rating: row.rating,
      comment: row.comment,
      verified_tenant: row.verified_tenant,
      helpful_count: row.helpful_count,
      created_at: row.created_at,
      author_name: row.author_name ?? undefined,
      author_avatar: row.author_avatar ?? undefined,
    }));

    return Response.json({
      data,
      total: data.length,
      page: 1,
      page_size: data.length,
    });
  } catch (err) {
    console.error("GET /api/reviews error:", err);
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

    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { target_type, target_id, rating, comment } = parsed.data;

    const result = await sql`
      INSERT INTO reviews (user_id, target_type, target_id, rating, comment)
      VALUES (
        ${user.id}::uuid,
        ${target_type}::review_target_type,
        ${target_id}::uuid,
        ${rating},
        ${comment}
      )
      RETURNING
        id, user_id, target_type, target_id,
        rating, comment, verified_tenant,
        helpful_count, created_at
    `;

    const row = result[0];
    const review: DbReview = {
      id: row.id,
      user_id: row.user_id,
      target_type: row.target_type,
      target_id: row.target_id,
      rating: row.rating,
      comment: row.comment,
      verified_tenant: row.verified_tenant,
      helpful_count: row.helpful_count,
      created_at: row.created_at,
    };

    return Response.json({ data: review }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
