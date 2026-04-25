import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { PropertyCard } from "@/components/PropertyCard";
import type {
  PropertyListItem,
  AvailabilityStatus,
  ListingStatus,
  PriceType,
  PropertyType,
} from "@/types";

interface SeekerBooking {
  id: string;
  property_id: string;
  scheduled_date: string;
  status: string;
  created_at: string;
  title: string;
  location: string;
}

interface SavedPropertyRow {
  id: string;
  created_at: string;
  property_id: string;
  title: string;
  price: number;
  price_type: PriceType;
  type: PropertyType;
  location: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  availability_status: AvailabilityStatus;
  listing_status: ListingStatus;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const [bookingRows, savedRows] = await Promise.all([
    sql`
      SELECT b.id, b.property_id, b.scheduled_date, b.status, b.created_at,
             p.title, p.location
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `,
    sql`
      SELECT sp.id, sp.created_at,
             p.id as property_id, p.title, p.price, p.price_type, p.type,
             p.location, p.neighborhood, p.bedrooms, p.bathrooms,
             p.images, p.availability_status
      FROM saved_properties sp
      JOIN properties p ON p.id = sp.property_id
      WHERE sp.user_id = ${userId} AND p.deleted_at IS NULL
      ORDER BY sp.created_at DESC
    `,
  ]);

  const bookings: SeekerBooking[] = bookingRows.map(
    (r: Record<string, unknown>) => ({
      id: r.id as string,
      property_id: r.property_id as string,
      scheduled_date: r.scheduled_date as string,
      status: r.status as string,
      created_at: r.created_at as string,
      title: r.title as string,
      location: r.location as string,
    }),
  );

  const savedProperties: PropertyListItem[] = (
    savedRows as SavedPropertyRow[]
  ).map((r) => ({
    id: r.property_id,
    title: r.title,
    price: Number(r.price),
    price_type: r.price_type,
    type: r.type,
    location: r.location,
    neighborhood: r.neighborhood,
    latitude: 0,
    longitude: 0,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    sqft: 0,
    images: r.images ?? [],
    availability_status: r.availability_status,
    listing_status: r.listing_status ?? "published",
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {session.user.name ?? session.user.email}
          </p>
        </div>

        {/* My Bookings */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            My Bookings
            {bookings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({bookings.length})
              </span>
            )}
          </h2>

          {bookings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-12 text-center">
              <p className="text-gray-400 dark:text-gray-500">
                No bookings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const statusStyles: Record<string, string> = {
                  pending: "bg-yellow-100 text-yellow-800",
                  confirmed: "bg-green-100 text-green-800",
                  cancelled: "bg-red-100 text-red-800",
                };
                const statusLabels: Record<string, string> = {
                  pending: "Pending",
                  confirmed: "Confirmed",
                  cancelled: "Cancelled",
                };
                return (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {booking.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {booking.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-500">
                        {formatDate(booking.scheduled_date)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[booking.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {statusLabels[booking.status] ?? booking.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Saved Listings */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Saved Listings
            {savedProperties.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({savedProperties.length})
              </span>
            )}
          </h2>

          {savedProperties.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-12 text-center">
              <p className="text-gray-400 dark:text-gray-500">
                No saved listings yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
