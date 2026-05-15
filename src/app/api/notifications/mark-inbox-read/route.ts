import { requireRole } from "@/lib/rbac";
import { sql } from "@/lib/db";

/**
 * Marks inbox-level notifications as read for the calling owner/agent.
 * This covers:
 *  - new_inquiry notifications (always link to /dashboard/inbox)
 *  - new_message notifications with the legacy /dashboard/inbox link
 *    (created before thread-specific links were introduced)
 */
export async function POST() {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    await sql`
      UPDATE notifications
      SET read = TRUE
      WHERE user_id = ${user.id}::uuid
        AND read = FALSE
        AND (
          type = 'new_inquiry'
          OR (type = 'new_message' AND link = '/dashboard/inbox')
        )
    `;

    return Response.json({ data: { ok: true } });
  } catch (err) {
    console.error("POST /api/notifications/mark-inbox-read error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
