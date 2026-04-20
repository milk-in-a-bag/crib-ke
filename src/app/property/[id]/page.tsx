import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import type {
  PropertyDetail,
  AreaRecord,
  DbReview,
  PropertyListItem,
} from "@/types";
import { SpecsGrid } from "@/components/SpecsGrid";
import { AreaIntelligence } from "@/components/AreaIntelligence";
import { ReviewSection } from "@/components/ReviewSection";
import { ContactPanel } from "@/components/ContactPanel";
import { SaveButton } from "@/components/SaveButton";
import { BookingForm } from "@/components/BookingForm";
import { Footer } from "@/components/Footer";
import { formatPrice } from "@/lib/utils";
import { MapView } from "@/components/MapView";

type Params = Promise<{ id: string }>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { readonly params: Params }) {
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  // Fetch property with area JOIN
  const rows = await sql`
    SELECT
      p.*,
      a.id            AS area_id,
      a.name          AS area_name,
      a.safety_score,
      a.water_score,
      a.commute_score,
      a.internet_score,
      a.flooding_score,
      a.summary       AS area_summary,
      a.updated_at    AS area_updated_at,
      ROUND(AVG(r.rating)::numeric, 1) AS rating,
      COUNT(r.id)::int                 AS review_count
    FROM properties p
    LEFT JOIN areas a ON a.name = p.neighborhood
    LEFT JOIN reviews r ON r.target_type = 'property' AND r.target_id = p.id
    WHERE p.id = ${id}::uuid AND p.deleted_at IS NULL
    GROUP BY p.id, a.id
  `;

  if (!rows[0]) {
    notFound();
  }

  const row = rows[0];

  let area: AreaRecord | undefined;
  if (row.area_id) {
    area = {
      id: row.area_id,
      name: row.area_name,
      safety_score: Number(row.safety_score),
      water_score: Number(row.water_score),
      commute_score: Number(row.commute_score),
      internet_score: Number(row.internet_score),
      flooding_score: Number(row.flooding_score),
      summary: row.area_summary,
      updated_at: row.area_updated_at,
    };
  }

  const property: PropertyDetail = {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    price_type: row.price_type,
    type: row.type,
    location: row.location,
    neighborhood: row.neighborhood,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    images: row.images ?? [],
    amenities: row.amenities ?? [],
    availability_status: row.availability_status,
    owner_id: row.owner_id,
    created_at: row.created_at,
    area,
    rating: row.rating ? Number(row.rating) : undefined,
    review_count: row.review_count ?? 0,
  };

  // Fetch reviews
  const reviewRows = await sql`
    SELECT
      r.id, r.user_id, r.target_type, r.target_id,
      r.rating, r.comment, r.verified_tenant,
      r.helpful_count, r.created_at,
      u.name  AS author_name,
      u.image AS author_avatar
    FROM reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.target_type = 'property' AND r.target_id = ${id}::uuid
    ORDER BY r.helpful_count DESC, r.created_at DESC
  `;

  const reviews: DbReview[] = reviewRows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    target_type: r.target_type,
    target_id: r.target_id,
    rating: r.rating,
    comment: r.comment,
    verified_tenant: r.verified_tenant,
    helpful_count: r.helpful_count,
    created_at: r.created_at,
    author_name: r.author_name ?? undefined,
    author_avatar: r.author_avatar ?? undefined,
  }));

  const mapProperty: PropertyListItem = {
    id: property.id,
    title: property.title,
    price: property.price,
    price_type: property.price_type,
    type: property.type,
    location: property.location,
    neighborhood: property.neighborhood,
    latitude: property.latitude,
    longitude: property.longitude,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    images: property.images,
    availability_status: property.availability_status,
    rating: property.rating,
    review_count: property.review_count,
  };

  const formattedPrice = formatPrice(property.price, property.price_type);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image Gallery */}
      <div className="relative h-[45vh] sm:h-[55vh] md:h-[60vh] bg-slate-900 overflow-hidden">
        {property.images[0] && (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

        {/* Top bar actions */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center space-x-2 sm:space-x-3">
          <SaveButton
            propertyId={property.id}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors"
          />
        </div>

        {/* Price badge */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
            <div className="text-xl sm:text-2xl font-bold text-accent">
              {formattedPrice}
            </div>
            <div className="text-xs text-slate-500 capitalize">
              {property.type.replaceAll("_", " ")}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-10">
        {/* Title card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">
                {property.title}
              </h1>
              <div className="flex items-center space-x-2 text-slate-600 text-sm sm:text-base">
                <span className="truncate">
                  {property.neighborhood}, {property.location}
                </span>
              </div>
            </div>
            {property.rating !== undefined && (
              <div className="shrink-0 text-right">
                <div className="text-2xl font-bold text-amber-500">
                  ★ {property.rating.toFixed(1)}
                </div>
                <div className="text-sm text-slate-500">
                  {property.review_count} review
                  {property.review_count !== 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>

          <p className="text-slate-600 text-sm sm:text-base md:text-lg mb-5 sm:mb-6">
            {property.description}
          </p>

          {property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              {property.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-700 rounded-full text-xs sm:text-sm font-medium"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          <SpecsGrid
            sqft={property.sqft}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            type={property.type}
          />
        </div>

        {/* Area Intelligence */}
        {area && (
          <div className="mb-6 sm:mb-8">
            <AreaIntelligence area={area} />
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <ReviewSection
              reviews={reviews}
              overallRating={property.rating ?? 0}
              reviewCount={property.review_count ?? 0}
            />
          </div>
        )}

        {/* Contact Panel */}
        <div className="mb-6 sm:mb-8">
          <ContactPanel
            agent={{
              name: "Property Manager",
              photo: "https://i.pravatar.cc/150?img=12",
              responseTime: "Within 2 hours",
            }}
          />
        </div>

        {/* Booking Form */}
        <div className="mb-6 sm:mb-8">
          <BookingForm propertyId={property.id} />
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-64 sm:h-80 md:h-96 mb-8">
          <MapView
            properties={[mapProperty]}
            center={[property.latitude, property.longitude]}
            zoom={15}
          />
        </div>
      </div>

      <Footer />

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0 hidden sm:block">
            <div className="text-xl sm:text-2xl font-bold text-accent">
              {formattedPrice}
            </div>
            <div className="text-sm text-slate-500 truncate">
              {property.neighborhood}, {property.location}
            </div>
          </div>
          <SaveButton
            propertyId={property.id}
            className="hidden sm:flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
