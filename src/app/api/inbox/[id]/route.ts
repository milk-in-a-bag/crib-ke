import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    const result = await sql`
      UPDATE contact_inquiries
      SET read = TRUE
      WHERE id = ${id}::uuid AND owner_id = ${user.id}::uuid
      RETURNING id, property_id, name, phone, message, user_id, owner_id, read, created_at
    `;

    if (result.length === 0) {
      return Response.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return Response.json({ data: result[0] });
  } catch (err) {
    console.error("PATCH /api/inbox/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
