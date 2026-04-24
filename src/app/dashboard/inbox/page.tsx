import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import type { UserRole } from "@/types";
import { OwnerInbox } from "@/components/OwnerInbox";
import type { Inquiry } from "@/components/OwnerInbox";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field
  const role = session.user.role as UserRole;
  if (!hasRole(role, "owner", "agent")) {
    redirect("/");
  }

  const userId = session.user.id;
  const pageSize = 20;

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
    WHERE ci.owner_id = ${userId}::uuid
    ORDER BY ci.created_at DESC
    LIMIT ${pageSize} OFFSET 0
  `;

  const countRows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE read = FALSE)::int AS unread_count
    FROM contact_inquiries
    WHERE owner_id = ${userId}::uuid
  `;

  const total: number = countRows[0]?.total ?? 0;
  const unreadCount: number = countRows[0]?.unread_count ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inbox
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <OwnerInbox
          initialData={rows as Inquiry[]}
          initialTotal={total}
          initialPage={1}
        />
      </div>
    </div>
  );
}
