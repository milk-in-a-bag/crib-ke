import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import type { PropertyDetail, AreaRecord } from "@/types";

const updatePropertySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().positive().optional(),
  price_type: z.enum(["rent", "sale"]).optional(),
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
  location: z.string().min(1).optional(),
  neighborhood: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  sqft: z.number().int().positive().optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  availability_status: z.enum(["available", "reserved", "taken"]).optional(),
});

type Params = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT
        p.*,
        a.id          AS area_id,
        a.name        AS area_name,
        a.safety_score,
        a.water_score,
        a.commute_score,
        a.internet_score,
        a.flooding_score,
        a.summary     AS area_summary,
        a.updated_at  AS area_updated_at,
        ROUND(AVG(r.rating)::numeric, 1) AS rating,
        COUNT(r.id)::int AS review_count
      FROM properties p
      LEFT JOIN areas a ON a.name = p.neighborhood
      LEFT JOIN reviews r ON r.target_type = 'property' AND r.target_id = p.id
      WHERE p.id = ${id}::uuid AND p.deleted_at IS NULL
      GROUP BY p.id, a.id
    `;

    if (!rows[0]) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const row = rows[0];

    let area: AreaRecord | undefined;
    if (row.area_id) {
      area = {
        id: row.area_id,
        name: row.area_name,
        safety_score: Number(row.safety_score),
        water_score: Number(row.water_score),
        commute_score: Number(row.commute_score),
        internet_score: Number(row.internet_score),
        flooding_score: Number(row.flooding_score),
        summary: row.area_summary,
        updated_at: row.area_updated_at,
      };
    }

    const property: PropertyDetail = {
      id: row.id,
      title: row.title,
      description: row.description,
      price: row.price,
      price_type: row.price_type,
      type: row.type,
      location: row.location,
      neighborhood: row.neighborhood,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      images: row.images ?? [],
      amenities: row.amenities ?? [],
      availability_status: row.availability_status,
      owner_id: row.owner_id,
      created_at: row.created_at,
      area,
      rating: row.rating ? Number(row.rating) : undefined,
      review_count: row.review_count ?? 0,
    };

    return Response.json({ data: property });
  } catch (err) {
    console.error("GET /api/properties/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    const existing = await sql`
      SELECT owner_id FROM properties WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;
    if (!existing[0]) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
    if (existing[0].owner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updatePropertySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const d = parsed.data;

    // Build SET clause dynamically
    const setClauses: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateParams: any[] = [];
    let idx = 1;

    if (d.title !== undefined) {
      setClauses.push("title = $" + idx++);
      updateParams.push(d.title);
    }
    if (d.description !== undefined) {
      setClauses.push("description = $" + idx++);
      updateParams.push(d.description);
    }
    if (d.price !== undefined) {
      setClauses.push("price = $" + idx++);
      updateParams.push(d.price);
    }
    if (d.price_type !== undefined) {
      setClauses.push("price_type = $" + idx++ + "::price_type");
      updateParams.push(d.price_type);
    }
    if (d.type !== undefined) {
      setClauses.push("type = $" + idx++ + "::property_type");
      updateParams.push(d.type);
    }
    if (d.location !== undefined) {
      setClauses.push("location = $" + idx++);
      updateParams.push(d.location);
    }
    if (d.neighborhood !== undefined) {
      setClauses.push("neighborhood = $" + idx++);
      updateParams.push(d.neighborhood);
    }
    if (d.latitude !== undefined) {
      setClauses.push("latitude = $" + idx++);
      updateParams.push(d.latitude);
    }
    if (d.longitude !== undefined) {
      setClauses.push("longitude = $" + idx++);
      updateParams.push(d.longitude);
    }
    if (d.bedrooms !== undefined) {
      setClauses.push("bedrooms = $" + idx++);
      updateParams.push(d.bedrooms);
    }
    if (d.bathrooms !== undefined) {
      setClauses.push("bathrooms = $" + idx++);
      updateParams.push(d.bathrooms);
    }
    if (d.sqft !== undefined) {
      setClauses.push("sqft = $" + idx++);
      updateParams.push(d.sqft);
    }
    if (d.images !== undefined) {
      setClauses.push("images = $" + idx++);
      updateParams.push(d.images);
    }
    if (d.amenities !== undefined) {
      setClauses.push("amenities = $" + idx++);
      updateParams.push(d.amenities);
    }
    if (d.availability_status !== undefined) {
      setClauses.push(
        "availability_status = $" + idx++ + "::availability_status",
      );
      updateParams.push(d.availability_status);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updateParams.push(id);
    const result = await sql.query(
      `UPDATE properties SET ${setClauses.join(", ")} WHERE id = $${idx}::uuid RETURNING *`,
      updateParams,
    );

    const row = result[0];
    const property: PropertyDetail = {
      id: row.id,
      title: row.title,
      description: row.description,
      price: row.price,
      price_type: row.price_type,
      type: row.type,
      location: row.location,
      neighborhood: row.neighborhood,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      images: row.images ?? [],
      amenities: row.amenities ?? [],
      availability_status: row.availability_status,
      owner_id: row.owner_id,
      created_at: row.created_at,
    };

    return Response.json({ data: property });
  } catch (err) {
    console.error("PUT /api/properties/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    const existing = await sql`
      SELECT owner_id FROM properties WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;
    if (!existing[0]) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }
    if (existing[0].owner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await sql`
      UPDATE properties SET deleted_at = NOW() WHERE id = ${id}::uuid
    `;

    return Response.json({ data: { id } });
  } catch (err) {
    console.error("DELETE /api/properties/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
