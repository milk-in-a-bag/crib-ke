import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";

export async function POST() {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const result = await sql`
      UPDATE notifications
      SET read = TRUE
      WHERE user_id = ${user.id}::uuid AND read = FALSE
      RETURNING id
    `;

    return Response.json({ updated: result.length });
  } catch (err) {
    console.error("POST /api/notifications/read-all error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
