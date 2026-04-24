import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import { BookingManager } from "@/components/BookingManager";
import type { BookingWithDetails, UserRole } from "@/types";

export default async function OwnerBookingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field
  const role = session.user.role as UserRole;
  if (!hasRole(role, "owner", "agent")) {
    redirect("/dashboard/profile");
  }

  const rows = await sql`
    SELECT
      b.id, b.user_id, b.property_id, b.scheduled_date, b.status, b.created_at,
      u.name  AS seeker_name,
      u.email AS seeker_email,
      p.title AS listing_title
    FROM bookings b
    JOIN properties p ON p.id = b.property_id
    JOIN users u ON u.id = b.user_id
    WHERE p.owner_id = ${session.user.id}::uuid
    ORDER BY b.created_at DESC
    LIMIT 50
  `;

  const bookings: BookingWithDetails[] = rows.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    property_id: r.property_id,
    scheduled_date: r.scheduled_date,
    status: r.status,
    created_at: r.created_at,
    seeker_name: r.seeker_name ?? "Unknown",
    seeker_email: r.seeker_email ?? "",
    listing_title: r.listing_title ?? "",
  }));

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Booking Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {bookings.length} total
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>

        <BookingManager initialBookings={bookings} />
      </div>
    </div>
  );
}
