import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import type { MessageThread, ThreadMessage } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    // Fetch the thread
    const threadRows = await sql`
      SELECT
        mt.id, mt.inquiry_id, mt.participant_seeker_id, mt.participant_owner_id,
        mt.created_at, mt.updated_at
      FROM message_threads mt
      WHERE mt.id = ${id}::uuid
      LIMIT 1
    `;

    if (threadRows.length === 0) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    const thread = threadRows[0] as MessageThread;

    // Enforce participant-only access
    if (
      thread.participant_seeker_id !== user.id &&
      thread.participant_owner_id !== user.id
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all messages ordered chronologically
    const messageRows = await sql`
      SELECT
        tm.id, tm.thread_id, tm.sender_id, tm.body,
        tm.read_by_seeker, tm.read_by_owner, tm.created_at,
        u.name AS sender_name
      FROM thread_messages tm
      JOIN users u ON u.id = tm.sender_id
      WHERE tm.thread_id = ${id}::uuid
      ORDER BY tm.created_at ASC
    `;

    const messages: ThreadMessage[] = messageRows.map((r) => ({
      id: r.id as string,
      thread_id: r.thread_id as string,
      sender_id: r.sender_id as string,
      body: r.body as string,
      read_by_seeker: r.read_by_seeker as boolean,
      read_by_owner: r.read_by_owner as boolean,
      created_at: r.created_at as string,
      sender_name: r.sender_name as string | undefined,
    }));

    return Response.json({ data: { ...thread, messages } });
  } catch (err) {
    console.error("GET /api/messages/threads/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
