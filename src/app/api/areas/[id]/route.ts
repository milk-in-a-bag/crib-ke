import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";
import type { AreaRecord } from "@/types";

const updateAreaSchema = z.object({
  safety_score: z.number().min(0).max(10).optional(),
  water_score: z.number().min(0).max(10).optional(),
  commute_score: z.number().min(0).max(10).optional(),
  internet_score: z.number().min(0).max(10).optional(),
  flooding_score: z.number().min(0).max(10).optional(),
  summary: z.string().max(100).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT id, name, safety_score, water_score, commute_score,
             internet_score, flooding_score, summary, updated_at
      FROM areas
      WHERE id = ${id}::uuid
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Area not found" }, { status: 404 });
    }

    const row = rows[0];
    const area: AreaRecord = {
      id: row.id,
      name: row.name,
      safety_score: Number(row.safety_score),
      water_score: Number(row.water_score),
      commute_score: Number(row.commute_score),
      internet_score: Number(row.internet_score),
      flooding_score: Number(row.flooding_score),
      summary: row.summary ?? "",
      updated_at: row.updated_at,
    };

    return Response.json({ data: area });
  } catch (err) {
    console.error("GET /api/areas/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // @ts-expect-error role is a custom field
    const role = session.user.role as string;
    if (role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateAreaSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const d = parsed.data;

    // Build SET clause dynamically — only update provided fields
    const setClauses: string[] = ["updated_at = NOW()"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let idx = 1;

    if (d.safety_score !== undefined) {
      setClauses.push("safety_score = $" + idx++);
      values.push(d.safety_score);
    }
    if (d.water_score !== undefined) {
      setClauses.push("water_score = $" + idx++);
      values.push(d.water_score);
    }
    if (d.commute_score !== undefined) {
      setClauses.push("commute_score = $" + idx++);
      values.push(d.commute_score);
    }
    if (d.internet_score !== undefined) {
      setClauses.push("internet_score = $" + idx++);
      values.push(d.internet_score);
    }
    if (d.flooding_score !== undefined) {
      setClauses.push("flooding_score = $" + idx++);
      values.push(d.flooding_score);
    }
    if (d.summary !== undefined) {
      setClauses.push("summary = $" + idx++);
      values.push(d.summary);
    }

    values.push(id); // last param for WHERE id = $N

    const rows = await sql.query(
      `UPDATE areas
       SET ${setClauses.join(", ")}
       WHERE id = $${idx}::uuid
       RETURNING id, name, safety_score, water_score, commute_score,
                 internet_score, flooding_score, summary, updated_at`,
      values,
    );

    if (rows.length === 0) {
      return Response.json({ error: "Area not found" }, { status: 404 });
    }

    const row = rows[0];
    const area: AreaRecord = {
      id: row.id,
      name: row.name,
      safety_score: Number(row.safety_score),
      water_score: Number(row.water_score),
      commute_score: Number(row.commute_score),
      internet_score: Number(row.internet_score),
      flooding_score: Number(row.flooding_score),
      summary: row.summary ?? "",
      updated_at: row.updated_at,
    };

    return Response.json({ data: area });
  } catch (err) {
    console.error("PUT /api/areas/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
