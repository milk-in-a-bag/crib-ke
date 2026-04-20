import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const result = await sql`
      UPDATE reviews
      SET helpful_count = helpful_count + 1
      WHERE id = ${id}::uuid
      RETURNING id, helpful_count
    `;

    if (result.length === 0) {
      return Response.json({ error: "Review not found" }, { status: 404 });
    }

    return Response.json({
      data: { id: result[0].id, helpful_count: result[0].helpful_count },
    });
  } catch (err) {
    console.error("POST /api/reviews/[id]/helpful error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
