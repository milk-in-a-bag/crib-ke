import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { NotificationType } from "@/types";

interface InsertNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  /**
   * When true and `link` is provided, upserts on the unique index
   * `idx_notifications_unique_user_type_link` (user_id, type, link).
   * This resets `read = FALSE` and updates title/body so the recipient
   * sees the latest notification without duplicate rows.
   */
  upsert?: boolean;
}

/**
 * Inserts a single notification row for the given user.
 * Accepts the `sql` tagged-template client so callers can pass a
 * transaction-scoped client when needed.
 */
export async function insertNotification(
  sql: NeonQueryFunction<false, false>,
  { userId, type, title, body, link, upsert }: InsertNotificationParams,
): Promise<void> {
  if (upsert && link) {
    await sql`
      INSERT INTO notifications (user_id, type, title, body, read, link)
      VALUES (${userId}, ${type}, ${title}, ${body}, FALSE, ${link})
      ON CONFLICT (user_id, type, link) WHERE link IS NOT NULL
      DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, read = FALSE
    `;
  } else {
    await sql`
      INSERT INTO notifications (user_id, type, title, body, read, link)
      VALUES (${userId}, ${type}, ${title}, ${body}, FALSE, ${link ?? null})
    `;
  }
}
