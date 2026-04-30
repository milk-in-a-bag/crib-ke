import Link from "next/link";
import { sql } from "@/lib/db";
import type { UserRole } from "@/types";

interface PendingListing {
  id: string;
  title: string;
  owner_name: string;
  created_at: string;
}

interface RecentUser {
  id: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

interface RoleCount {
  role: UserRole;
  cnt: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const roleColors: Record<UserRole, string> = {
  seeker: "bg-blue-100 text-blue-800",
  owner: "bg-purple-100 text-purple-800",
  agent: "bg-indigo-100 text-indigo-800",
  admin: "bg-red-100 text-red-800",
};

export async function AdminDashboard() {
  const [
    listingStatsRows,
    userRoleRows,
    bookings30dRows,
    pendingListingRows,
    recentUserRows,
  ] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE listing_status = 'pending_review')::int AS pending_review,
        COUNT(*) FILTER (WHERE listing_status = 'published')::int AS published
      FROM properties WHERE deleted_at IS NULL
    `,
    sql`
      SELECT role, COUNT(*)::int AS cnt FROM users GROUP BY role
    `,
    sql`
      SELECT COUNT(*)::int AS bookings_30d
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `,
    sql`
      SELECT
        p.id,
        p.title,
        COALESCE(u.name, u.email, 'Unknown') AS owner_name,
        p.created_at
      FROM properties p
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.listing_status = 'pending_review' AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `,
    sql`
      SELECT id, COALESCE(name, email, 'Unknown') AS display_name, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `,
  ]);

  const pendingReviewCount: number =
    (listingStatsRows[0]?.pending_review as number) ?? 0;
  const publishedCount: number =
    (listingStatsRows[0]?.published as number) ?? 0;
  const bookings30d: number = (bookings30dRows[0]?.bookings_30d as number) ?? 0;

  const roleCounts: RoleCount[] = (
    userRoleRows as Record<string, unknown>[]
  ).map((r) => ({
    role: r.role as UserRole,
    cnt: r.cnt as number,
  }));
  const totalUsers = roleCounts.reduce((sum, r) => sum + r.cnt, 0);

  const pendingListings: PendingListing[] = (
    pendingListingRows as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    owner_name: r.owner_name as string,
    created_at: r.created_at as string,
  }));

  const recentUsers: RecentUser[] = (
    recentUserRows as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as string,
    display_name: r.display_name as string,
    role: r.role as UserRole,
    created_at: r.created_at as string,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform-wide overview
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Pending Review
            </p>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingReviewCount}
            </p>
            <Link
              href="/dashboard/admin/queue"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 inline-block"
            >
              Review Queue →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Registered Users
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalUsers}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {roleCounts.map((rc) => (
                <span
                  key={rc.role}
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[rc.role] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {rc.role}: {rc.cnt}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Published Listings
            </p>
            <p className="text-3xl font-bold text-green-600">
              {publishedCount}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Bookings (30 days)
            </p>
            <p className="text-3xl font-bold text-blue-600">{bookings30d}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Review Listings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Review Listings
              </h2>
              <Link
                href="/dashboard/admin/queue"
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                View queue
              </Link>
            </div>
            {pendingListings.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
                No listings pending review
              </p>
            ) : (
              <div className="space-y-3">
                {pendingListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href="/dashboard/admin/queue"
                        className="font-medium text-gray-900 dark:text-white text-sm hover:text-orange-500 transition-colors truncate block"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        by {listing.owner_name}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatDate(listing.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Registered Users */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recently Registered Users
            </h2>
            {recentUsers.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
                No users yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {user.display_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDateTime(user.created_at)}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[user.role] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {user.role}
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
