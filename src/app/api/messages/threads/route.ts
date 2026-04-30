import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/rbac";
import { insertNotification } from "@/lib/notifications";
import type { MessageThread } from "@/types";

const createThreadSchema = z.object({
  inquiry_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    // Only owners and agents may create threads
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createThreadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { inquiry_id, body } = parsed.data;

    // Look up the inquiry
    const inquiryRows = await sql`
      SELECT id, user_id, owner_id
      FROM contact_inquiries
      WHERE id = ${inquiry_id}::uuid
    `;

    if (inquiryRows.length === 0) {
      return Response.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const inquiry = inquiryRows[0];

    // 422 if the seeker is not a registered user
    if (!inquiry.user_id) {
      return Response.json(
        {
          error: "Cannot start a thread: the seeker is not a registered user.",
        },
        { status: 422 },
      );
    }

    const seekerId = inquiry.user_id as string;

    // Idempotency: return existing thread if one already exists for this inquiry
    const existingRows = await sql`
      SELECT
        mt.id, mt.inquiry_id, mt.participant_seeker_id, mt.participant_owner_id,
        mt.created_at, mt.updated_at
      FROM message_threads mt
      WHERE mt.inquiry_id = ${inquiry_id}::uuid
      LIMIT 1
    `;

    if (existingRows.length > 0) {
      return Response.json({ data: existingRows[0] });
    }

    // Create the thread
    const threadRows = await sql`
      INSERT INTO message_threads (inquiry_id, participant_seeker_id, participant_owner_id)
      VALUES (${inquiry_id}::uuid, ${seekerId}::uuid, ${user.id}::uuid)
      RETURNING id, inquiry_id, participant_seeker_id, participant_owner_id, created_at, updated_at
    `;

    const thread = threadRows[0] as MessageThread;

    // Insert the first message
    await sql`
      INSERT INTO thread_messages (thread_id, sender_id, body)
      VALUES (${thread.id}::uuid, ${user.id}::uuid, ${body})
    `;

    // Update thread updated_at to reflect the new message
    await sql`
      UPDATE message_threads
      SET updated_at = NOW()
      WHERE id = ${thread.id}::uuid
    `;

    // Notify the seeker with deduplication
    await insertNotification(sql, {
      userId: seekerId,
      type: "new_message",
      title: "New message from your inquiry",
      body: body.length > 100 ? body.slice(0, 100) + "…" : body,
      link: `/dashboard/messages/${thread.id}`,
      upsert: true,
    });

    return Response.json({ data: thread }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages/threads error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const role = user.role;

    const rows = await sql`
      SELECT
        mt.id, mt.inquiry_id, mt.participant_seeker_id, mt.participant_owner_id,
        mt.created_at, mt.updated_at,
        ci.message AS inquiry_message,
        p.title AS listing_title,
        us.name AS seeker_name,
        uo.name AS owner_name,
        COUNT(tm.id) FILTER (
          WHERE (${role} = 'seeker' AND tm.read_by_seeker = FALSE)
             OR (${role} != 'seeker' AND tm.read_by_owner = FALSE)
        )::int AS unread_count
      FROM message_threads mt
      JOIN contact_inquiries ci ON ci.id = mt.inquiry_id
      JOIN properties p ON p.id = ci.property_id
      JOIN users us ON us.id = mt.participant_seeker_id
      JOIN users uo ON uo.id = mt.participant_owner_id
      LEFT JOIN thread_messages tm ON tm.thread_id = mt.id
      WHERE mt.participant_seeker_id = ${user.id}::uuid
         OR mt.participant_owner_id = ${user.id}::uuid
      GROUP BY mt.id, ci.message, p.title, us.name, uo.name
      ORDER BY mt.updated_at DESC
    `;

    return Response.json({ data: rows });
  } catch (err) {
    console.error("GET /api/messages/threads error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
