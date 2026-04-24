import { Home } from "@/views/Home";
import { sql } from "@/lib/db";
import type { PropertyListItem, AreaRecord } from "@/types";

export default async function Page() {
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
    (row: any) => ({
      id: row.id,
      title: row.title,
      price: row.price,
      price_type: row.price_type,
      type: row.type,
      location: row.location,
      neighborhood: row.neighborhood,
      latitude: Number.parseFloat(row.latitude),
      longitude: Number.parseFloat(row.longitude),
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      sqft: row.sqft,
      images: row.images,
      availability_status: row.availability_status,
      rating: row.rating ? Number.parseFloat(row.rating) : undefined,
      review_count: row.review_count
        ? Number.parseInt(row.review_count)
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

  const areas: AreaRecord[] = areasResult.map((row: any) => ({
    id: row.id,
    name: row.name,
    safety_score: Number.parseFloat(row.safety_score),
    water_score: Number.parseFloat(row.water_score),
    commute_score: Number.parseFloat(row.commute_score),
    internet_score: Number.parseFloat(row.internet_score),
    flooding_score: Number.parseFloat(row.flooding_score),
    summary: row.summary,
    updated_at: row.updated_at,
  }));

  return <Home featuredProperties={featuredProperties} areas={areas} />;
}
