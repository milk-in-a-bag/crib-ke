import { type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireRole } from "@/lib/rbac";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole("owner", "agent");
    if (!authResult.ok) return authResult.response;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { error: "Validation failed", details: "Invalid form data" },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Validation failed", details: "Missing file field" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json(
        {
          error: "Validation failed",
          details: `Unsupported MIME type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        {
          error: "Validation failed",
          details: `File size ${file.size} bytes exceeds the 10 MB limit`,
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("No result from Cloudinary"));
            } else {
              resolve(result);
            }
          })
          .end(buffer);
      },
    );

    return Response.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
