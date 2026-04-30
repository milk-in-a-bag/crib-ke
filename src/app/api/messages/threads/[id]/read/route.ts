import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import type { MessageThread } from "@/types";

export async function PATCH(
  _request: NextRequest,
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

    // Mark messages as read for the calling user's role
    const isSeeker = user.id === thread.participant_seeker_id;

    if (isSeeker) {
      await sql`
        UPDATE thread_messages
        SET read_by_seeker = TRUE
        WHERE thread_id = ${id}::uuid AND read_by_seeker = FALSE
      `;
    } else {
      await sql`
        UPDATE thread_messages
        SET read_by_owner = TRUE
        WHERE thread_id = ${id}::uuid AND read_by_owner = FALSE
      `;
    }

    return Response.json({ data: { ok: true } });
  } catch (err) {
    console.error("PATCH /api/messages/threads/[id]/read error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
