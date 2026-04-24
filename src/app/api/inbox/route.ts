import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const pageParam = request.nextUrl.searchParams.get("page");
    const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const rows = await sql`
      SELECT
        ci.id,
        ci.property_id,
        ci.name,
        ci.phone,
        ci.message,
        ci.user_id,
        ci.owner_id,
        ci.read,
        ci.created_at,
        p.title AS listing_title
      FROM contact_inquiries ci
      LEFT JOIN properties p ON p.id = ci.property_id
      WHERE ci.owner_id = ${user.id}::uuid
      ORDER BY ci.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM contact_inquiries
      WHERE owner_id = ${user.id}::uuid
    `;

    const total: number = countRows[0]?.total ?? 0;

    return Response.json({
      data: rows,
      total,
      page,
      page_size: pageSize,
    });
  } catch (err) {
    console.error("GET /api/inbox error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
