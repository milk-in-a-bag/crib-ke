import { auth } from "@/auth";
import { sql } from "@/lib/db";
import type { UserRole } from "@/types";
import { NavbarClient } from "@/components/NavbarClient";

export async function Navbar() {
  const session = await auth();
  // @ts-expect-error role is a custom field attached in the JWT callback
  const role = (session?.user?.role as UserRole) ?? null;
  const userId = session?.user?.id ?? null;

  let unreadCount = 0;
  if (userId) {
    try {
      const result = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM notifications
        WHERE user_id = ${userId}::uuid AND read = FALSE
      `;
      unreadCount = result[0]?.cnt ?? 0;
    } catch {
      // Non-fatal — badge just shows 0 if DB is unavailable
    }
  }

  // Fetch unread message count for Owner/Agent users (Requirement 11.2)
  let unreadMessageCount = 0;
  if (userId && (role === "owner" || role === "agent")) {
    try {
      const result = await sql`
        SELECT COUNT(*)::int AS unread_count
        FROM thread_messages tm
        JOIN message_threads mt ON mt.id = tm.thread_id
        WHERE mt.participant_owner_id = ${userId}::uuid
          AND tm.read_by_owner = FALSE
      `;
      unreadMessageCount = result[0]?.unread_count ?? 0;
    } catch {
      // Non-fatal — badge just shows 0 if DB is unavailable
    }
  }

  return (
    <NavbarClient
      initialUnreadCount={unreadCount}
      serverRole={role}
      unreadMessageCount={unreadMessageCount}
    />
  );
}
