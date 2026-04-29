import { Home } from "@/views/Home";
import { sql } from "@/lib/db";
import type { PropertyListItem, AreaRecord } from "@/types";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  // Fetch 6 most recent available properties
  const propertiesResult = await sql`
    SELECT 
      p.id,
      p.title,
      p.price,
      p.price_type,
      p.type,
      p.location,
      p.neighborhood,
      p.latitude,
      p.longitude,
      p.bedrooms,
      p.bathrooms,
      p.sqft,
      p.images,
      p.availability_status,
      p.listing_status,
      COALESCE(AVG(r.rating), 0) as rating,
      COUNT(r.id) as review_count
    FROM properties p
    LEFT JOIN reviews r ON r.target_type = 'property' AND r.target_id = p.id
    WHERE p.deleted_at IS NULL
      AND p.availability_status = 'available'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 6
  `;

  const featuredProperties: PropertyListItem[] = propertiesResult.map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      price: row.price as number,
      price_type: row.price_type as PropertyListItem["price_type"],
      type: row.type as PropertyListItem["type"],
      location: row.location as string,
      neighborhood: row.neighborhood as string,
      latitude: Number.parseFloat(row.latitude as string),
      longitude: Number.parseFloat(row.longitude as string),
      bedrooms: row.bedrooms as number,
      bathrooms: row.bathrooms as number,
      sqft: row.sqft as number,
      images: row.images as string[],
      availability_status:
        row.availability_status as PropertyListItem["availability_status"],
      listing_status: row.listing_status as PropertyListItem["listing_status"],
      published_at: (row.published_at as string) ?? undefined,
      rejection_reason: (row.rejection_reason as string) ?? undefined,
      rating: row.rating ? Number.parseFloat(row.rating as string) : undefined,
      review_count: row.review_count
        ? Number.parseInt(row.review_count as string)
        : undefined,
    }),
  );

  // Fetch all areas with listing counts
  const areasResult = await sql`
    SELECT 
      a.id,
      a.name,
      a.safety_score,
      a.water_score,
      a.commute_score,
      a.internet_score,
      a.flooding_score,
      a.summary,
      a.updated_at,
      COUNT(p.id) as listing_count,
      COALESCE(AVG(p.price), 0) as avg_price
    FROM areas a
    LEFT JOIN properties p ON p.neighborhood = a.name 
      AND p.deleted_at IS NULL 
      AND p.availability_status = 'available'
    GROUP BY a.id, a.name, a.safety_score, a.water_score, a.commute_score, 
             a.internet_score, a.flooding_score, a.summary, a.updated_at
    ORDER BY listing_count DESC
    LIMIT 4
  `;

  const areas: AreaRecord[] = areasResult.map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      safety_score: Number.parseFloat(row.safety_score as string),
      water_score: Number.parseFloat(row.water_score as string),
      commute_score: Number.parseFloat(row.commute_score as string),
      internet_score: Number.parseFloat(row.internet_score as string),
      flooding_score: Number.parseFloat(row.flooding_score as string),
      summary: row.summary as string,
      updated_at: row.updated_at as string,
    }),
  );

  return <Home featuredProperties={featuredProperties} areas={areas} />;
}
