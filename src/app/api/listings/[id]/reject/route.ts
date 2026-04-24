import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { insertNotification } from "@/lib/notifications";
import type { PropertyDetail } from "@/types";

const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

type Params = Promise<{ id: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireRole("admin");
    if (!authResult.ok) return authResult.response;

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

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
          details: `Cannot reject a listing with status '${listing.listing_status}'. Only 'pending_review' listings can be rejected.`,
        },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE properties
      SET listing_status = 'rejected'::listing_status,
          rejection_reason = ${parsed.data.reason}
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    const row = result[0];

    await insertNotification(sql, {
      userId: listing.owner_id,
      type: "listing_rejected",
      title: "Listing rejected",
      body: `Your listing "${listing.title}" was not approved. Reason: ${parsed.data.reason}`,
      link: `/dashboard/listings/${id}/edit`,
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
    console.error("POST /api/listings/[id]/reject error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
