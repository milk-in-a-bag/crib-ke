import Link from "next/link";
import { sql } from "@/lib/db";

interface OwnerInquiry {
  id: string;
  sender_name: string;
  listing_title: string;
  message_preview: string;
  created_at: string;
}

interface OwnerPendingBooking {
  id: string;
  seeker_name: string;
  listing_title: string;
  scheduled_date: string;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface OwnerDashboardProps {
  readonly userId: string;
}

export async function OwnerDashboard({ userId }: OwnerDashboardProps) {
  // Run all queries in parallel
  const [
    publishedCountRows,
    inquiryCountRows,
    pendingBookingCountRows,
    recentInquiryRows,
    pendingBookingRows,
    hasListingsRows,
  ] = await Promise.all([
    sql`
      SELECT COUNT(*) FILTER (WHERE listing_status = 'published')::int AS published_count
      FROM properties
      WHERE owner_id = ${userId}::uuid AND deleted_at IS NULL
    `,
    sql`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE read = FALSE)::int AS unread_count
      FROM contact_inquiries
      WHERE owner_id = ${userId}::uuid
    `,
    sql`
      SELECT COUNT(*)::int AS pending_count
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE p.owner_id = ${userId}::uuid AND b.status = 'pending'
    `,
    sql`
      SELECT
        ci.id,
        COALESCE(ci.name, 'Unknown') AS sender_name,
        COALESCE(p.title, 'Unknown property') AS listing_title,
        ci.message AS message_preview,
        ci.created_at
      FROM contact_inquiries ci
      LEFT JOIN properties p ON p.id = ci.property_id
      WHERE ci.owner_id = ${userId}::uuid
      ORDER BY ci.created_at DESC
      LIMIT 5
    `,
    sql`
      SELECT
        b.id,
        COALESCE(u.name, u.email, 'Unknown') AS seeker_name,
        COALESCE(p.title, 'Unknown property') AS listing_title,
        b.scheduled_date
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      JOIN users u ON u.id = b.user_id
      WHERE p.owner_id = ${userId}::uuid AND b.status = 'pending'
      ORDER BY b.created_at DESC
      LIMIT 5
    `,
    sql`
      SELECT COUNT(*)::int AS cnt
      FROM properties
      WHERE owner_id = ${userId}::uuid AND deleted_at IS NULL
    `,
  ]);

  const publishedCount: number =
    (publishedCountRows[0]?.published_count as number) ?? 0;
  const unreadCount: number =
    (inquiryCountRows[0]?.unread_count as number) ?? 0;
  const pendingBookingCount: number =
    (pendingBookingCountRows[0]?.pending_count as number) ?? 0;
  const hasListings: boolean = ((hasListingsRows[0]?.cnt as number) ?? 0) > 0;

  const recentInquiries: OwnerInquiry[] = recentInquiryRows.map(
    (r: Record<string, unknown>) => ({
      id: r.id as string,
      sender_name: r.sender_name as string,
      listing_title: r.listing_title as string,
      message_preview: ((r.message_preview as string) ?? "").slice(0, 100),
      created_at: r.created_at as string,
    }),
  );

  const pendingBookings: OwnerPendingBooking[] = pendingBookingRows.map(
    (r: Record<string, unknown>) => ({
      id: r.id as string,
      seeker_name: r.seeker_name as string,
      listing_title: r.listing_title as string,
      scheduled_date: r.scheduled_date as string,
    }),
  );

  if (!hasListings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-4">
              You have no listings yet
            </p>
            <Link
              href="/dashboard/listings/new"
              className="text-orange-500 hover:text-orange-600 font-semibold text-sm"
            >
              Create your first listing →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your listings and activity
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Published Listings
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {publishedCount}
            </p>
            <Link
              href="/dashboard/listings"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 inline-block"
            >
              View all listings →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Unread Inquiries
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {unreadCount}
            </p>
            <Link
              href="/dashboard/inbox"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 inline-block"
            >
              Go to Inbox →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Pending Bookings
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {pendingBookingCount}
            </p>
            <Link
              href="/dashboard/bookings"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 inline-block"
            >
              View bookings →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inquiries */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Inquiries
              </h2>
              <Link
                href="/dashboard/inbox"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                View all
              </Link>
            </div>
            {recentInquiries.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
                No inquiries yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {inquiry.sender_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {inquiry.listing_title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {inquiry.message_preview}
                          {(inquiry.message_preview?.length ?? 0) >= 100 && "…"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatRelativeTime(inquiry.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Bookings
              </h2>
              <Link
                href="/dashboard/bookings"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                View all
              </Link>
            </div>
            {pendingBookings.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
                No pending bookings
              </p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {booking.seeker_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {booking.listing_title}
                      </p>
                    </div>
                    <span className="ml-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(booking.scheduled_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
