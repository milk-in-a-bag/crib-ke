import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { insertNotification } from "@/lib/notifications";
import type { BookingRecord, BookingStatus } from "@/types";

type Params = Promise<{ id: string }>;

const patchBookingSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("reschedule"),
    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "scheduled_date must be YYYY-MM-DD"),
  }),
]);

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    // Fetch booking with property owner info
    const existing = await sql`
      SELECT b.id, b.user_id, b.property_id, b.scheduled_date, b.status, b.created_at,
             p.owner_id, p.title AS listing_title,
             u.name AS seeker_name
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      JOIN users u ON u.id = b.user_id
      WHERE b.id = ${id}::uuid
    `;

    if (!existing[0]) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = existing[0];
    const isOwner = booking.owner_id === user.id;
    const isSeeker = booking.user_id === user.id;

    if (!isOwner && !isSeeker) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = patchBookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { action } = parsed.data;
    const currentStatus = booking.status as BookingStatus;

    // Seekers can only cancel confirmed bookings or reschedule/cancel pending ones
    if (isSeeker && !isOwner) {
      if (action === "confirm") {
        return Response.json(
          { error: "Seekers cannot confirm bookings" },
          { status: 403 },
        );
      }
      if (action === "reschedule" && currentStatus !== "pending") {
        return Response.json(
          {
            error:
              "You can only reschedule a pending booking. If your visit was confirmed, please cancel and request a new date.",
          },
          { status: 403 },
        );
      }
    }

    if (action === "confirm") {
      if (!VALID_TRANSITIONS[currentStatus].includes("confirmed")) {
        return Response.json(
          { error: `Cannot confirm a booking with status: ${currentStatus}` },
          { status: 400 },
        );
      }

      const result = await sql`
        UPDATE bookings
        SET status = 'confirmed'::booking_status
        WHERE id = ${id}::uuid
        RETURNING id, user_id, property_id, scheduled_date, status, created_at
      `;

      await insertNotification(sql, {
        userId: booking.user_id,
        type: "booking_confirmed",
        title: "Visit Confirmed",
        body: `Your visit to "${booking.listing_title}" on ${booking.scheduled_date} has been confirmed.`,
        link: `/property/${booking.property_id}`,
      });

      return Response.json({ data: mapBooking(result[0]) });
    }

    if (action === "cancel") {
      if (!VALID_TRANSITIONS[currentStatus].includes("cancelled")) {
        return Response.json(
          { error: `Cannot cancel a booking with status: ${currentStatus}` },
          { status: 400 },
        );
      }

      const result = await sql`
        UPDATE bookings
        SET status = 'cancelled'::booking_status
        WHERE id = ${id}::uuid
        RETURNING id, user_id, property_id, scheduled_date, status, created_at
      `;

      // Notify the other party
      if (isOwner && !isSeeker) {
        // Owner cancelled — notify seeker
        await insertNotification(sql, {
          userId: booking.user_id,
          type: "booking_cancelled",
          title: "Visit Cancelled",
          body: `Your visit to "${booking.listing_title}" on ${booking.scheduled_date} has been cancelled by the owner.`,
          link: `/property/${booking.property_id}`,
        });
      } else if (isSeeker && !isOwner) {
        // Seeker cancelled — notify owner
        await insertNotification(sql, {
          userId: booking.owner_id,
          type: "booking_cancelled",
          title: "Visit Cancelled",
          body: `${booking.seeker_name ?? "A seeker"} cancelled their visit to "${booking.listing_title}" on ${booking.scheduled_date}.`,
          link: `/dashboard/bookings`,
        });
      }

      return Response.json({ data: mapBooking(result[0]) });
    }

    if (action === "reschedule") {
      const { scheduled_date } = parsed.data as {
        action: "reschedule";
        scheduled_date: string;
      };

      const result = await sql`
        UPDATE bookings
        SET scheduled_date = ${scheduled_date}::date,
            status = 'pending'::booking_status
        WHERE id = ${id}::uuid
        RETURNING id, user_id, property_id, scheduled_date, status, created_at
      `;

      await insertNotification(sql, {
        userId: booking.user_id,
        type: "booking_rescheduled",
        title: "Visit Rescheduled",
        body: `Your visit to "${booking.listing_title}" has been rescheduled to ${scheduled_date}.`,
        link: `/property/${booking.property_id}`,
      });

      return Response.json({ data: mapBooking(result[0]) });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/bookings/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function mapBooking(row: Record<string, unknown>): BookingRecord {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    property_id: row.property_id as string,
    scheduled_date: row.scheduled_date as string,
    status: row.status as BookingStatus,
    created_at: row.created_at as string,
  };
}

// Keep the existing PUT handler for backward compatibility
const updateBookingSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    if (user.role !== "owner" && user.role !== "agent") {
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

    const VALID: Record<BookingStatus, BookingStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["cancelled"],
      cancelled: [],
    };

    if (!VALID[currentStatus].includes(newStatus)) {
      return Response.json(
        { error: `Invalid status transition: ${currentStatus} → ${newStatus}` },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE bookings
      SET status = ${newStatus}::booking_status
      WHERE id = ${id}::uuid
      RETURNING id, user_id, property_id, scheduled_date, status, created_at
    `;

    return Response.json({ data: mapBooking(result[0]) });
  } catch (err) {
    console.error("PUT /api/bookings/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
