import { sql } from "@/lib/db";
import type { AreaRecord } from "@/types";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, name, safety_score, water_score, commute_score,
             internet_score, flooding_score, summary, updated_at
      FROM areas
      ORDER BY name ASC
    `;

    const data: AreaRecord[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      safety_score: Number(row.safety_score),
      water_score: Number(row.water_score),
      commute_score: Number(row.commute_score),
      internet_score: Number(row.internet_score),
      flooding_score: Number(row.flooding_score),
      summary: row.summary ?? "",
      updated_at: row.updated_at,
    }));

    return Response.json({
      data,
      total: data.length,
      page: 1,
      page_size: data.length,
    });
  } catch (err) {
    console.error("GET /api/areas error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
