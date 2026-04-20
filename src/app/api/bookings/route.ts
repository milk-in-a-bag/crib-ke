import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";
import type { BookingRecord } from "@/types";

const createBookingSchema = z.object({
  property_id: z.string().uuid(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "scheduled_date must be in YYYY-MM-DD format")
    .refine((date) => {
      const today = new Date().toISOString().slice(0, 10);
      return date >= today;
    }, "scheduled_date must be today or in the future"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return Response.json(
        { error: "user_id query param is required" },
        { status: 400 },
      );
    }

    const rows = await sql`
      SELECT id, user_id, property_id, scheduled_date, status, created_at
      FROM bookings
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `;

    const data: BookingRecord[] = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      property_id: row.property_id,
      scheduled_date: row.scheduled_date,
      status: row.status,
      created_at: row.created_at,
    }));

    return Response.json({
      data,
      total: data.length,
      page: 1,
      page_size: data.length,
    });
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-expect-error role is a custom field on our user
    if (session.user.role !== "seeker") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { property_id, scheduled_date } = parsed.data;

    const result = await sql`
      INSERT INTO bookings (user_id, property_id, scheduled_date, status)
      VALUES (
        ${session.user.id}::uuid,
        ${property_id}::uuid,
        ${scheduled_date}::date,
        'pending'
      )
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

    return Response.json({ data: booking }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
