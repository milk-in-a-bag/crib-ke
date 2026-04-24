import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

type Params = Promise<{ id: string }>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const authResult = await requireRole("seeker");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    const existing = await sql`
      SELECT id FROM saved_properties
      WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
    `;

    if (!existing[0]) {
      return Response.json(
        { error: "Saved property not found" },
        { status: 404 },
      );
    }

    await sql`
      DELETE FROM saved_properties
      WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
    `;

    return Response.json({ data: { id } });
  } catch (err) {
    console.error("DELETE /api/saved/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
