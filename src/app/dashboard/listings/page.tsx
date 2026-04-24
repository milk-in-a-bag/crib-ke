import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import type { AvailabilityStatus, PriceType, PropertyType } from "@/types";

interface OwnerListing {
  id: string;
  title: string;
  price: number;
  price_type: PriceType;
  type: PropertyType;
  location: string;
  neighborhood: string;
  availability_status: AvailabilityStatus;
  created_at: string;
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  taken: "bg-red-100 text-red-800",
};

const typeLabels: Record<PropertyType, string> = {
  bedsitter: "Bedsitter",
  one_bedroom: "1 Bedroom",
  two_bedroom: "2 Bedroom",
  three_bedroom: "3 Bedroom",
  studio: "Studio",
  villa: "Villa",
  townhouse: "Townhouse",
};

export default async function ListingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const rows = await sql`
    SELECT id, title, price, price_type, type, location, neighborhood, availability_status, created_at
    FROM properties
    WHERE owner_id = ${session.user.id} AND deleted_at IS NULL
    ORDER BY created_at DESC
  `;

  const listings: OwnerListing[] = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    price: Number(r.price),
    price_type: r.price_type,
    type: r.type,
    location: r.location,
    neighborhood: r.neighborhood,
    availability_status: r.availability_status,
    created_at: r.created_at,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Listings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {listings.length}{" "}
              {listings.length === 1 ? "property" : "properties"}
            </p>
          </div>
          <Link
            href="/property/new"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Add Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-4">
              No listings yet
            </p>
            <Link
              href="/property/new"
              className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
            >
              Create your first listing →
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Title
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Type
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/property/${listing.id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-orange-500 transition-colors"
                      >
                        {listing.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {typeLabels[listing.type] ?? listing.type}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(listing.price, listing.price_type)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {listing.neighborhood}, {listing.location}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[listing.availability_status]}`}
                      >
                        {listing.availability_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/property/${listing.id}`}
                          className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/property/${listing.id}/edit`}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
