import Link from "next/link";
import { sql } from "@/lib/db";
import { PropertyCard } from "@/components/PropertyCard";
import type { BookingStatus, PropertyListItem } from "@/types";

interface SeekerBooking {
  id: string;
  scheduled_date: string;
  status: BookingStatus;
  title: string;
}

interface SavedPropertyRow {
  id: string;
  property_id: string;
  title: string;
  price: number;
  price_type: PropertyListItem["price_type"];
  type: PropertyListItem["type"];
  location: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  availability_status: PropertyListItem["availability_status"];
}

const bookingStatusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface SeekerDashboardProps {
  readonly userId: string;
  readonly displayName: string;
}

export async function SeekerDashboard({
  userId,
  displayName,
}: SeekerDashboardProps) {
  // Run all queries in parallel
  const [bookingRows, savedSearchCountRows, savedPropertyRows] =
    await Promise.all([
      sql`
        SELECT b.id, b.scheduled_date, b.status, p.title
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.user_id = ${userId}::uuid
        ORDER BY b.created_at DESC
        LIMIT 3
      `,
      sql`
        SELECT COUNT(*)::int AS cnt
        FROM saved_searches
        WHERE user_id = ${userId}::uuid
      `,
      sql`
        SELECT sp.id, p.id AS property_id, p.title, p.price, p.price_type,
               p.type, p.location, p.neighborhood, p.bedrooms, p.bathrooms,
               p.images, p.availability_status
        FROM saved_properties sp
        JOIN properties p ON p.id = sp.property_id
        WHERE sp.user_id = ${userId}::uuid AND p.deleted_at IS NULL
        ORDER BY sp.created_at DESC
        LIMIT 3
      `,
    ]);

  const bookings: SeekerBooking[] = bookingRows.map(
    (r: Record<string, unknown>) => ({
      id: r.id as string,
      scheduled_date: r.scheduled_date as string,
      status: r.status as BookingStatus,
      title: r.title as string,
    }),
  );

  const savedSearchCount: number =
    (savedSearchCountRows[0]?.cnt as number) ?? 0;

  const savedProperties: PropertyListItem[] = savedPropertyRows.map(
    (r: Record<string, unknown>) => ({
      id: r.property_id as string,
      title: r.title as string,
      price: Number(r.price),
      price_type: r.price_type as PropertyListItem["price_type"],
      type: r.type as PropertyListItem["type"],
      location: r.location as string,
      neighborhood: r.neighborhood as string,
      latitude: 0,
      longitude: 0,
      bedrooms: Number(r.bedrooms),
      bathrooms: Number(r.bathrooms),
      sqft: 0,
      images: (r.images as string[]) ?? [],
      availability_status:
        r.availability_status as PropertyListItem["availability_status"],
      listing_status: "published",
    }),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here&apos;s a summary of your activity on CribKE.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Bookings
              </h2>
            </div>
            {bookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 dark:text-gray-500 mb-3">
                  No bookings yet
                </p>
                <Link
                  href="/explore"
                  className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
                >
                  Explore properties →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {booking.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(booking.scheduled_date)}
                      </p>
                    </div>
                    <span
                      className={`ml-4 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${bookingStatusColors[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Searches */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Saved Searches
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-4xl font-bold text-orange-500 mb-2">
                {savedSearchCount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                active {savedSearchCount === 1 ? "search" : "searches"}
              </p>
              <Link
                href="/dashboard/saved-searches"
                className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
              >
                Manage saved searches →
              </Link>
            </div>
          </div>
        </div>

        {/* Saved Properties */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recently Saved Properties
            </h2>
          </div>
          {savedProperties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 dark:text-gray-500 mb-3">
                No saved properties yet
              </p>
              <Link
                href="/explore"
                className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
              >
                Explore properties →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
