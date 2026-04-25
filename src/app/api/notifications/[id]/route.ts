import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import type { NotificationRecord } from "@/types";

const patchSchema = z.object({
  read: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { read } = parsed.data;

    const result = await sql`
      UPDATE notifications
      SET read = ${read}
      WHERE id = ${id}::uuid AND user_id = ${user.id}::uuid
      RETURNING id, user_id, type, title, body, read, link, created_at
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    const row = result[0];
    const data: NotificationRecord = {
      id: row.id as string,
      user_id: row.user_id as string,
      type: row.type as NotificationRecord["type"],
      title: row.title as string,
      body: row.body as string,
      read: row.read as boolean,
      link: row.link as string | undefined,
      created_at: row.created_at as string,
    };

    return Response.json({ data });
  } catch (err) {
    console.error("PATCH /api/notifications/[id] error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
