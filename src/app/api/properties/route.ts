import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";
import type { PropertyListItem, PropertyDetail } from "@/types";

const createPropertySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  price_type: z.enum(["rent", "sale"]),
  type: z.enum([
    "bedsitter",
    "one_bedroom",
    "two_bedroom",
    "three_bedroom",
    "studio",
    "villa",
    "townhouse",
  ]),
  location: z.string().min(1),
  neighborhood: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().int().min(0).default(0),
  sqft: z.number().int().positive().optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  availability_status: z
    .enum(["available", "reserved", "taken"])
    .default("available"),
});

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q") ?? null;
    const minPrice = sp.get("min_price") ? Number(sp.get("min_price")) : null;
    const maxPrice = sp.get("max_price") ? Number(sp.get("max_price")) : null;
    const type = sp.get("type") ?? null;
    const amenitiesRaw = sp.get("amenities");
    const amenities = amenitiesRaw
      ? amenitiesRaw.split(",").filter(Boolean)
      : null;
    const sort = sp.get("sort") ?? "newest";
    const page = Math.max(1, Number(sp.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(sp.get("page_size") ?? "12")),
    );
    const offset = (page - 1) * pageSize;

    // Build WHERE clauses dynamically
    const conditions: string[] = ["p.deleted_at IS NULL"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    let idx = 1;

    if (q) {
      conditions.push(
        `(p.location ILIKE $${idx} OR p.neighborhood ILIKE $${idx} OR p.title ILIKE $${idx})`,
      );
      params.push(`%${q}%`);
      idx++;
    }
    if (minPrice !== null && !Number.isNaN(minPrice)) {
      conditions.push(`p.price >= $${idx}`);
      params.push(minPrice);
      idx++;
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      conditions.push(`p.price <= $${idx}`);
      params.push(maxPrice);
      idx++;
    }
    if (type) {
      conditions.push(`p.type = $${idx}::property_type`);
      params.push(type);
      idx++;
    }
    if (amenities && amenities.length > 0) {
      conditions.push(`p.amenities @> $${idx}::text[]`);
      params.push(amenities);
      idx++;
    }

    const whereClause = conditions.join(" AND ");

    // Sort order
    let orderClause: string;
    if (sort === "price_asc") {
      orderClause = "p.price ASC";
    } else if (sort === "price_desc") {
      orderClause = "p.price DESC";
    } else if (sort === "best_match") {
      orderClause = `(
        COALESCE(AVG(r.rating) OVER (PARTITION BY p.id), 0) * 20
        + COALESCE(a.safety_score, 5) * 4
        + COALESCE(a.commute_score, 5) * 4
        + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / -86400.0
      ) DESC`;
    } else {
      orderClause = "p.created_at DESC";
    }

    // Count query
    const countResult = await sql.query(
      `SELECT COUNT(*) AS total
       FROM properties p
       WHERE ${whereClause}`,
      params,
    );
    const total = Number(countResult[0]?.total ?? 0);

    // Data query — lean PropertyListItem shape
    const limitIdx = idx;
    const offsetIdx = idx + 1;
    const rows = await sql.query(
      `SELECT
         p.id, p.title, p.price, p.price_type, p.type,
         p.location, p.neighborhood, p.latitude, p.longitude,
         p.bedrooms, p.bathrooms, p.sqft, p.images,
         p.availability_status,
         ROUND(AVG(r.rating)::numeric, 1) AS rating,
         COUNT(r.id)::int AS review_count,
         a.safety_score, a.commute_score
       FROM properties p
       LEFT JOIN reviews r ON r.target_type = 'property' AND r.target_id = p.id
       LEFT JOIN areas a ON a.name = p.neighborhood
       WHERE ${whereClause}
       GROUP BY p.id, a.safety_score, a.commute_score
       ORDER BY ${orderClause}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...params, pageSize, offset],
    );

    const data: PropertyListItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
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
      availability_status: row.availability_status,
      rating: row.rating ? Number(row.rating) : undefined,
      review_count: row.review_count ?? 0,
    }));

    return Response.json({ data, total, page, page_size: pageSize });
  } catch (err) {
    console.error("GET /api/properties error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // @ts-expect-error role is a custom field
    const role = session.user.role as string;
    if (role !== "owner" && role !== "agent") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const result = await sql`
      INSERT INTO properties (
        title, description, price, price_type, type,
        location, neighborhood, latitude, longitude,
        bedrooms, bathrooms, sqft, images, amenities,
        availability_status, owner_id
      ) VALUES (
        ${d.title}, ${d.description ?? null}, ${d.price}, ${d.price_type}::price_type, ${d.type}::property_type,
        ${d.location}, ${d.neighborhood}, ${d.latitude}, ${d.longitude},
        ${d.bedrooms}, ${d.bathrooms}, ${d.sqft ?? null}, ${d.images}, ${d.amenities},
        ${d.availability_status}::availability_status, ${session.user.id}::uuid
      )
      RETURNING *
    `;

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

    return Response.json({ data: property }, { status: 201 });
  } catch (err) {
    console.error("POST /api/properties error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
