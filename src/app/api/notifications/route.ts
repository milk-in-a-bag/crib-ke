import { type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";
import type { NotificationRecord } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;
    const { user } = authResult;

    const unreadOnly =
      request.nextUrl.searchParams.get("unread_only") === "true";
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(limitParam ?? "20", 10) || 20),
    );

    // Always compute total unread count regardless of limit/filter
    const unreadCountResult = await sql`
      SELECT COUNT(*)::int AS unread_count
      FROM notifications
      WHERE user_id = ${user.id}::uuid AND read = FALSE
    `;
    const unread_count: number = unreadCountResult[0]?.unread_count ?? 0;

    const rows = unreadOnly
      ? await sql`
          SELECT id, user_id, type, title, body, read, link, created_at
          FROM notifications
          WHERE user_id = ${user.id}::uuid AND read = FALSE
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT id, user_id, type, title, body, read, link, created_at
          FROM notifications
          WHERE user_id = ${user.id}::uuid
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;

    const data: NotificationRecord[] = rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      type: r.type as NotificationRecord["type"],
      title: r.title as string,
      body: r.body as string,
      read: r.read as boolean,
      link: r.link as string | undefined,
      created_at: r.created_at as string,
    }));

    return Response.json({ data, unread_count });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
