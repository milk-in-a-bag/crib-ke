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

  return <NavbarClient initialUnreadCount={unreadCount} serverRole={role} />;
}
