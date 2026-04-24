import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { insertNotification } from "@/lib/notifications";
import type { PropertyDetail } from "@/types";

type Params = Promise<{ id: string }>;

export async function POST(
  _request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireRole("admin");
    if (!authResult.ok) return authResult.response;

    const { id } = await params;

    const existing = await sql`
      SELECT id, owner_id, listing_status, title
      FROM properties
      WHERE id = ${id}::uuid AND deleted_at IS NULL
    `;

    if (!existing[0]) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const listing = existing[0];

    if (listing.listing_status !== "pending_review") {
      return Response.json(
        {
          error: "Invalid status transition",
          details: `Cannot approve a listing with status '${listing.listing_status}'. Only 'pending_review' listings can be approved.`,
        },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE properties
      SET listing_status = 'published'::listing_status,
          published_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    const row = result[0];

    await insertNotification(sql, {
      userId: listing.owner_id,
      type: "listing_approved",
      title: "Listing approved",
      body: `Your listing "${listing.title}" has been approved and is now live.`,
      link: `/property/${id}`,
    });

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
      listing_status: row.listing_status,
      published_at: row.published_at ?? undefined,
      rejection_reason: row.rejection_reason ?? undefined,
      owner_id: row.owner_id,
      created_at: row.created_at,
    };

    return Response.json({ data: property });
  } catch (err) {
    console.error("POST /api/listings/[id]/approve error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
