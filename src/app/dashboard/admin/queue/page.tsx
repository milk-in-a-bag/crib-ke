import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import type { UserRole } from "@/types";
import { AdminQueueClient } from "./AdminQueueClient";
import type { AdminQueueListing } from "@/components/AdminReviewCard";

export default async function AdminQueuePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field
  const role = session.user.role as UserRole;
  if (!hasRole(role, "admin")) {
    redirect("/");
  }

  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.description,
      p.type,
      p.price,
      p.price_type,
      p.neighborhood,
      p.location,
      p.bedrooms,
      p.bathrooms,
      p.sqft,
      p.amenities,
      p.images,
      p.latitude,
      p.longitude,
      p.availability_status,
      p.created_at,
      u.id AS owner_id,
      COALESCE(u.name, u.email, 'Unknown') AS owner_name,
      u.email AS owner_email
    FROM properties p
    LEFT JOIN users u ON u.id = p.owner_id
    WHERE p.listing_status = 'pending_review'
      AND p.deleted_at IS NULL
    ORDER BY p.created_at ASC
  `;

  const listings: AdminQueueListing[] = rows.map(
    (r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) ?? "",
      type: r.type as AdminQueueListing["type"],
      price: Number(r.price),
      price_type: r.price_type as AdminQueueListing["price_type"],
      neighborhood: r.neighborhood as string,
      location: r.location as string,
      bedrooms: Number(r.bedrooms ?? 0),
      bathrooms: Number(r.bathrooms ?? 0),
      sqft: r.sqft ? Number(r.sqft) : null,
      amenities: (r.amenities as string[]) ?? [],
      images: (r.images as string[]) ?? [],
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      availability_status: r.availability_status as string,
      owner_id: r.owner_id as string,
      owner_name: r.owner_name as string,
      owner_email: (r.owner_email as string) ?? "",
      created_at: r.created_at as string,
    }),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Queue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}{" "}
            pending review
          </p>
        </div>

        <AdminQueueClient initialListings={listings} />
      </div>
    </div>
  );
}
