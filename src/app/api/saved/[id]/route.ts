import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

type Params = Promise<{ id: string }>;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the record belongs to the session user before deleting
    const existing = await sql`
      SELECT id FROM saved_properties
      WHERE id = ${id}::uuid AND user_id = ${session.user.id}::uuid
    `;

    if (!existing[0]) {
      return Response.json(
        { error: "Saved property not found" },
        { status: 404 },
      );
    }

    await sql`
      DELETE FROM saved_properties
      WHERE id = ${id}::uuid AND user_id = ${session.user.id}::uuid
    `;

    return Response.json({ data: { id } });
  } catch (err) {
    console.error("DELETE /api/saved/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
