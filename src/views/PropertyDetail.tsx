"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type {
  PropertyDetail as PropertyDetailType,
  PropertyListItem,
  DbReview,
} from "@/types";
import { SpecsGrid } from "../components/SpecsGrid";
import { AreaIntelligence } from "../components/AreaIntelligence";
import { ReviewSection } from "../components/ReviewSection";
import { ContactPanel } from "../components/ContactPanel";
import { Footer } from "../components/Footer";
import { SaveButton } from "../components/SaveButton";
import { formatPrice } from "@/lib/utils";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("../components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse" />,
  },
);

export function PropertyDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetailType | null>(null);
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/properties/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/reviews?target_type=property&target_id=${id}`).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([propJson, reviewJson]) => {
        if (propJson?.data) setProperty(propJson.data);
        if (reviewJson?.data) setReviews(reviewJson.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return <div className="p-8 text-center">Property not found</div>;
  }

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  const prevImage = () =>
    setCurrentImageIndex(
      (prev) => (prev - 1 + property.images.length) % property.images.length,
    );

  const formattedPrice = formatPrice(property.price, property.price_type);

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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image Gallery */}
      <div className="relative h-[45vh] sm:h-[55vh] md:h-[60vh] bg-slate-900">
        {property.images[currentImageIndex] && (
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

        <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg"
          >
            <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <SaveButton
              propertyId={property.id}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors"
            />
            <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg">
              <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </button>
          </div>
        </div>

        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
            >
              <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
          {property.images.map((_, index) => (
            <button
              key={`dot-${property.id}-${index}`}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "bg-white w-8" : "bg-white/50 w-2"}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-10">
        <motion.div
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
            <div className="sm:text-right shrink-0">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent mb-1">
                {formattedPrice}
              </div>
              <div className="inline-block px-3 py-1 bg-violet-100 text-accent rounded-full text-xs sm:text-sm font-semibold capitalize">
                {property.type.replaceAll("_", " ")}
              </div>
            </div>
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
        </motion.div>

        {property.area && (
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AreaIntelligence area={property.area} />
          </motion.div>
        )}

        {reviews.length > 0 && (
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ReviewSection
              reviews={reviews}
              overallRating={property.rating ?? 0}
              reviewCount={property.review_count ?? 0}
            />
          </motion.div>
        )}

        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ContactPanel
            agent={{
              name: "Property Manager",
              photo: "https://i.pravatar.cc/150?img=12",
              responseTime: "Within 2 hours",
            }}
            propertyId={property.id}
          />
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-sm overflow-hidden h-64 sm:h-80 md:h-96 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MapView
            properties={[mapProperty]}
            center={[property.latitude, property.longitude]}
            zoom={15}
          />
        </motion.div>
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
