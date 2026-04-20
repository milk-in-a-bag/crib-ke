import { type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { auth } from "@/auth";

const contactSchema = z.object({
  property_id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
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

    // Optionally attach session user_id if authenticated
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const result = await sql`
      INSERT INTO contact_inquiries (property_id, name, phone, message, user_id)
      VALUES (
        ${property_id}::uuid,
        ${name},
        ${phone},
        ${message},
        ${userId}::uuid
      )
      RETURNING id, property_id, name, phone, message, user_id, created_at
    `;

    return Response.json({ data: result[0] });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
