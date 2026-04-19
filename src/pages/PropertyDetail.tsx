"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  HeartIcon,
  ShareIcon,
  MoreVerticalIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { properties } from "../data/properties";
import { reviews } from "../data/reviews";
import { SpecsGrid } from "../components/SpecsGrid";
import { AreaIntelligence } from "../components/AreaIntelligence";
import { ReviewSection } from "../components/ReviewSection";
import { ContactPanel } from "../components/ContactPanel";
import { MapView } from "../components/MapView";
import { Footer } from "../components/Footer";
export function PropertyDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const property = properties.find((p) => p.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  if (!property) {
    return <div className="p-8 text-center">Property not found</div>;
  }
  const propertyReviews = reviews.filter((r) => r.propertyId === property.id);
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };
  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + property.images.length) % property.images.length,
    );
  };
  const formatPrice = (price: number, type: "sale" | "rent") => {
    if (type === "rent") {
      return `$${price.toLocaleString()}/month`;
    }
    return `$${price.toLocaleString()}`;
  };
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Image Gallery */}
      <div className="relative h-[45vh] sm:h-[55vh] md:h-[60vh] bg-slate-900">
        <img
          src={property.images[currentImageIndex]}
          alt={property.name}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg"
          >
            <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg">
              <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </button>
            <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg">
              <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
            </button>
            <button className="hidden sm:flex w-12 h-12 bg-white rounded-full items-center justify-center hover:bg-slate-100 transition-colors shadow-lg">
              <MoreVerticalIcon className="w-6 h-6 text-slate-900" />
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
              key={index}
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
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          {/* Mobile: stacked layout */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">
                {property.name}
              </h1>
              <div className="flex items-center space-x-2 text-slate-600 text-sm sm:text-base">
                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="truncate">{property.address}</span>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent mb-1">
                {formatPrice(property.price, property.priceType)}
              </div>
              <div className="inline-block px-3 py-1 bg-violet-100 text-accent rounded-full text-xs sm:text-sm font-semibold">
                {property.type}
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-sm sm:text-base md:text-lg mb-5 sm:mb-6">
            {property.description}
          </p>

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

          <SpecsGrid
            sqft={property.sqft}
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            type={property.type}
          />
        </motion.div>

        <motion.div
          className="mb-6 sm:mb-8"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
        >
          <AreaIntelligence data={property.areaIntelligence} />
        </motion.div>

        {propertyReviews.length > 0 && (
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
          >
            <ReviewSection
              reviews={propertyReviews}
              overallRating={property.rating}
              reviewCount={property.reviewCount}
            />
          </motion.div>
        )}

        <motion.div
          className="mb-6 sm:mb-8"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.3,
          }}
        >
          <ContactPanel agent={property.agent} />
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-sm overflow-hidden h-64 sm:h-80 md:h-96 mb-8"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.4,
          }}
        >
          <MapView
            properties={[property]}
            center={property.coordinates}
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
              {formatPrice(property.price, property.priceType)}
            </div>
            <div className="text-sm text-slate-500 truncate">
              {property.address}
            </div>
          </div>
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors shadow-lg">
            Schedule a Visit
          </button>
        </div>
      </div>
    </div>
  );
}
