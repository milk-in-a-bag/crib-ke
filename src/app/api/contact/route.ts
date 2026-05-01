import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";
import { insertNotification } from "@/lib/notifications";

const contactSchema = z.object({
  property_id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication before any other logic (Requirement 5.4)
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: "You must be signed in to send an inquiry." },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.message },
        { status: 400 },
      );
    }

    const { property_id, name, phone, message } = parsed.data;

    // Look up the listing's owner_id (Requirement 3.3, 3.7)
    const propertyRows = await sql`
      SELECT owner_id FROM properties WHERE id = ${property_id}::uuid AND deleted_at IS NULL
    `;
    const ownerId: string | null = propertyRows[0]?.owner_id ?? null;

    const result = await sql`
      INSERT INTO contact_inquiries (property_id, name, phone, message, user_id, owner_id)
      VALUES (
        ${property_id}::uuid,
        ${name},
        ${phone},
        ${message},
        ${userId},
        ${ownerId}
      )
      RETURNING id, property_id, name, phone, message, user_id, owner_id, created_at
    `;

    // Fire notification for the owner if one exists (Requirement 3.3)
    if (ownerId) {
      // Get listing title for the notification body
      const titleRows = await sql`
        SELECT title FROM properties WHERE id = ${property_id}::uuid
      `;
      const listingTitle: string = titleRows[0]?.title ?? "your listing";

      await insertNotification(sql, {
        userId: ownerId,
        type: "new_inquiry",
        title: "New inquiry received",
        body: `${name} sent an inquiry about "${listingTitle}"`,
        link: `/dashboard/inbox`,
      });
    }

    return Response.json({ data: result[0] });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
