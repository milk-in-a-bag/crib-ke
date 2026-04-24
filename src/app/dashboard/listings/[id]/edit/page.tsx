import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { ListingForm } from "@/components/ListingForm";
import type { PropertyDetail } from "@/types";

type Params = Promise<{ id: string }>;

export default async function EditListingPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const rows = await sql`
    SELECT * FROM properties
    WHERE id = ${id}::uuid AND deleted_at IS NULL
  `;

  if (!rows[0]) {
    notFound();
  }

  const row = rows[0];

  if (row.owner_id !== session.user.id) {
    // Return a 403-style page
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            You do not have permission to edit this listing.
          </p>
        </div>
      </div>
    );
  }

  const listing: PropertyDetail = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: Number(row.price),
    price_type: row.price_type,
    type: row.type,
    location: row.location,
    neighborhood: row.neighborhood,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft ?? 0,
    images: row.images ?? [],
    amenities: row.amenities ?? [],
    availability_status: row.availability_status,
    listing_status: row.listing_status,
    published_at: row.published_at ?? undefined,
    rejection_reason: row.rejection_reason ?? undefined,
    owner_id: row.owner_id,
    created_at: row.created_at,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Listing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {listing.title}
          </p>
          {listing.listing_status === "rejected" &&
            listing.rejection_reason && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                <span className="font-semibold">Rejection reason:</span>{" "}
                {listing.rejection_reason}
              </div>
            )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8">
          <ListingForm initialData={listing} />
        </div>
      </div>
    </div>
  );
}
