import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import { insertNotification } from "@/lib/notifications";
import type { MessageThread, ThreadMessage } from "@/types";

const postMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    // Fetch the thread to verify existence and participation
    const threadRows = await sql`
      SELECT id, participant_seeker_id, participant_owner_id
      FROM message_threads
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (threadRows.length === 0) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    const thread = threadRows[0] as MessageThread;

    // Participants-only check
    if (
      thread.participant_seeker_id !== user.id &&
      thread.participant_owner_id !== user.id
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = postMessageSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { body } = parsed.data;

    // Insert the message
    const messageRows = await sql`
      INSERT INTO thread_messages (thread_id, sender_id, body)
      VALUES (${id}::uuid, ${user.id}::uuid, ${body})
      RETURNING id, thread_id, sender_id, body, read_by_seeker, read_by_owner, created_at
    `;

    const message: ThreadMessage = {
      id: messageRows[0].id as string,
      thread_id: messageRows[0].thread_id as string,
      sender_id: messageRows[0].sender_id as string,
      body: messageRows[0].body as string,
      read_by_seeker: messageRows[0].read_by_seeker as boolean,
      read_by_owner: messageRows[0].read_by_owner as boolean,
      created_at: messageRows[0].created_at as string,
    };

    // Update thread updated_at
    await sql`
      UPDATE message_threads
      SET updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    // Determine the other participant and notify them
    const isSeeker = user.id === thread.participant_seeker_id;
    const recipientId = isSeeker
      ? (thread.participant_owner_id as string)
      : (thread.participant_seeker_id as string);

    const notificationLink = isSeeker
      ? `/dashboard/inbox`
      : `/dashboard/messages/${id}`;

    await insertNotification(sql, {
      userId: recipientId,
      type: "new_message",
      title: "New message",
      body: body.length > 100 ? body.slice(0, 100) + "…" : body,
      link: notificationLink,
      upsert: true,
    });

    return Response.json({ data: message }, { status: 201 });
  } catch (err) {
    console.error("POST /api/messages/threads/[id]/messages error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
