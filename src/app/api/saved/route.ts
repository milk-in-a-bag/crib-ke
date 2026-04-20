import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

const createSavedSchema = z.object({
  property_id: z.string().uuid(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rows = await sql`
      SELECT
        sp.id,
        sp.user_id,
        sp.property_id,
        sp.created_at,
        p.title,
        p.price,
        p.price_type,
        p.type,
        p.location,
        p.neighborhood,
        p.latitude,
        p.longitude,
        p.bedrooms,
        p.bathrooms,
        p.sqft,
        p.images,
        p.availability_status
      FROM saved_properties sp
      JOIN properties p ON p.id = sp.property_id
      WHERE sp.user_id = ${userId}::uuid
      ORDER BY sp.created_at DESC
    `;

    return Response.json({
      data: rows,
      total: rows.length,
      page: 1,
      page_size: rows.length,
    });
  } catch (err) {
    console.error("GET /api/saved error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createSavedSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { property_id } = parsed.data;

    const result = await sql`
      INSERT INTO saved_properties (user_id, property_id)
      VALUES (${session.user.id}::uuid, ${property_id}::uuid)
      RETURNING id, user_id, property_id, created_at
    `;

    return Response.json({ data: result[0] }, { status: 201 });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return Response.json(
        {
          error: "Property already saved",
          details: "This property is already in your saved list.",
        },
        { status: 409 },
      );
    }
    console.error("POST /api/saved error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
