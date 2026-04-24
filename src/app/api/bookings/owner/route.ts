import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import type { BookingWithDetails } from "@/types";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const offset = (page - 1) * PAGE_SIZE;

    const validStatuses = ["pending", "confirmed", "cancelled"];
    const useStatusFilter =
      statusFilter && validStatuses.includes(statusFilter);

    const rows = useStatusFilter
      ? await sql`
          SELECT
            b.id, b.user_id, b.property_id, b.scheduled_date, b.status, b.created_at,
            u.name  AS seeker_name,
            u.email AS seeker_email,
            p.title AS listing_title
          FROM bookings b
          JOIN properties p ON p.id = b.property_id
          JOIN users u ON u.id = b.user_id
          WHERE p.owner_id = ${user.id}::uuid
            AND b.status = ${statusFilter}::booking_status
          ORDER BY b.created_at DESC
          LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `
      : await sql`
          SELECT
            b.id, b.user_id, b.property_id, b.scheduled_date, b.status, b.created_at,
            u.name  AS seeker_name,
            u.email AS seeker_email,
            p.title AS listing_title
          FROM bookings b
          JOIN properties p ON p.id = b.property_id
          JOIN users u ON u.id = b.user_id
          WHERE p.owner_id = ${user.id}::uuid
          ORDER BY b.created_at DESC
          LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `;

    const countRows = useStatusFilter
      ? await sql`
          SELECT COUNT(*) AS total
          FROM bookings b
          JOIN properties p ON p.id = b.property_id
          WHERE p.owner_id = ${user.id}::uuid
            AND b.status = ${statusFilter}::booking_status
        `
      : await sql`
          SELECT COUNT(*) AS total
          FROM bookings b
          JOIN properties p ON p.id = b.property_id
          WHERE p.owner_id = ${user.id}::uuid
        `;

    const total = Number(countRows[0]?.total ?? 0);

    const data: BookingWithDetails[] = rows.map(
      (r: Record<string, unknown>) => ({
        id: r.id as string,
        user_id: r.user_id as string,
        property_id: r.property_id as string,
        scheduled_date: r.scheduled_date as string,
        status: r.status as BookingWithDetails["status"],
        created_at: r.created_at as string,
        seeker_name: (r.seeker_name as string) ?? "Unknown",
        seeker_email: (r.seeker_email as string) ?? "",
        listing_title: (r.listing_title as string) ?? "",
      }),
    );

    return Response.json({ data, total, page, page_size: PAGE_SIZE });
  } catch (err) {
    console.error("GET /api/bookings/owner error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
