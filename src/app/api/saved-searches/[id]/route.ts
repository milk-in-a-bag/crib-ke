import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole("seeker");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    const result = await sql`
      DELETE FROM saved_searches
      WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Not found or you do not own this saved search" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/saved-searches/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
