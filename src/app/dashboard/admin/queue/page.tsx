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
      p.type,
      p.price,
      p.price_type,
      p.neighborhood,
      p.location,
      p.images,
      p.created_at,
      COALESCE(u.name, u.email, 'Unknown') AS owner_name
    FROM properties p
    LEFT JOIN users u ON u.id = p.owner_id
    WHERE p.listing_status = 'pending_review'
      AND p.deleted_at IS NULL
    ORDER BY p.created_at ASC
  `;

  const listings: AdminQueueListing[] = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    price: Number(r.price),
    price_type: r.price_type,
    neighborhood: r.neighborhood,
    location: r.location,
    images: r.images ?? [],
    owner_name: r.owner_name,
    created_at: r.created_at,
  }));

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
