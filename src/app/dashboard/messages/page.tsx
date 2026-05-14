import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import type { MessageThread, UserRole } from "@/types";
import { ThreadView } from "@/components/ThreadView";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field attached in the JWT callback
  const role = session.user.role as UserRole;
  if (role !== "seeker") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  const rows = await sql`
    SELECT
      mt.id, mt.inquiry_id, mt.participant_seeker_id, mt.participant_owner_id,
      mt.created_at, mt.updated_at,
      ci.message AS inquiry_message,
      p.title AS listing_title,
      us.name AS seeker_name,
      uo.name AS owner_name,
      COUNT(tm.id) FILTER (WHERE tm.read_by_seeker = FALSE)::int AS unread_count
    FROM message_threads mt
    JOIN contact_inquiries ci ON ci.id = mt.inquiry_id
    JOIN properties p ON p.id = ci.property_id
    JOIN users us ON us.id = mt.participant_seeker_id
    JOIN users uo ON uo.id = mt.participant_owner_id
    LEFT JOIN thread_messages tm ON tm.thread_id = mt.id
    WHERE mt.participant_seeker_id = ${userId}::uuid
    GROUP BY mt.id, ci.message, p.title, us.name, uo.name
    ORDER BY mt.updated_at DESC
  `;

  const threads: MessageThread[] = rows.map((r) => ({
    id: r.id as string,
    inquiry_id: r.inquiry_id as string,
    participant_seeker_id: r.participant_seeker_id as string,
    participant_owner_id: r.participant_owner_id as string,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
    inquiry_message: r.inquiry_message as string | undefined,
    listing_title: r.listing_title as string | undefined,
    seeker_name: r.seeker_name as string | undefined,
    owner_name: r.owner_name as string | undefined,
    unread_count: r.unread_count as number | undefined,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <ThreadView threads={threads} currentUserId={userId} />
    </div>
  );
}
