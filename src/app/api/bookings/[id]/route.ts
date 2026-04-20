import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";
import type { BookingRecord, BookingStatus } from "@/types";

const updateBookingSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
});

type Params = Promise<{ id: string }>;

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-expect-error role is a custom field on our user
    const role: string = session.user.role;
    if (role !== "owner" && role !== "agent") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await sql`
      SELECT id, user_id, property_id, scheduled_date, status, created_at
      FROM bookings
      WHERE id = ${id}::uuid
    `;

    if (!existing[0]) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const currentStatus = existing[0].status as BookingStatus;
    const newStatus = parsed.data.status;

    if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
      return Response.json(
        {
          error: `Invalid status transition: ${currentStatus} → ${newStatus}`,
        },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE bookings
      SET status = ${newStatus}::booking_status
      WHERE id = ${id}::uuid
      RETURNING id, user_id, property_id, scheduled_date, status, created_at
    `;

    const row = result[0];
    const booking: BookingRecord = {
      id: row.id,
      user_id: row.user_id,
      property_id: row.property_id,
      scheduled_date: row.scheduled_date,
      status: row.status,
      created_at: row.created_at,
    };

    return Response.json({ data: booking });
  } catch (err) {
    console.error("PUT /api/bookings/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
