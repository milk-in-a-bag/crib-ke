"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { FilterSidebar } from "../components/FilterSidebar";
import { PropertyCard } from "../components/PropertyCard";
import { properties } from "../data/properties";
import type { PropertyListItem } from "@/types";
import { ChevronDownIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

// Adapt legacy static Property shape to PropertyListItem
const propertyListItems: PropertyListItem[] = properties.map((p) => ({
  id: p.id,
  title: p.name,
  price: p.price,
  price_type: p.priceType,
  type: p.type.toLowerCase().replace(" ", "_") as PropertyListItem["type"],
  location: p.location,
  neighborhood: p.neighborhood,
  latitude: p.coordinates[0],
  longitude: p.coordinates[1],
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  sqft: p.sqft,
  images: p.images,
  availability_status: "available",
  rating: p.rating,
  review_count: p.reviewCount,
}));
import { AnimatePresence, motion } from "framer-motion";

const MapView = dynamic(
  () => import("../components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse" />,
  },
);
export function Explore() {
  const [searchType, setSearchType] = useState<"buy" | "rent">("buy");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block shrink-0">
        <FilterSidebar />
      </div>

      {/* Mobile filter overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() => setShowFilters(false)}
            />

            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
              initial={{
                x: "-100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100%",
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
            >
              <div className="relative">
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
                <FilterSidebar />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden p-2 border border-slate-200 rounded-xl text-slate-600 hover:border-accent hover:text-accent transition-colors shrink-0"
            aria-label="Open filters"
          >
            <SlidersHorizontalIcon className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "buy" | "rent")}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 sm:px-4 py-2 pr-8 sm:pr-10 font-semibold text-sm cursor-pointer hover:border-accent transition-colors"
            >
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <input
            type="text"
            placeholder="Forest Hill, San Francisco, CA"
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-accent transition-colors text-sm"
          />

          <div className="relative hidden sm:block shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 font-semibold text-sm cursor-pointer hover:border-accent transition-colors"
            >
              <option value="relevance">Sort by: Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Map - takes all remaining space */}
        <div
          className="flex-1 min-h-0 relative"
          style={{
            minHeight: "300px",
          }}
        >
          <MapView
            properties={propertyListItems}
            center={[37.7749, -122.4194]}
            zoom={13}
          />
        </div>

        {/* Property cards strip - fixed height */}
        <div
          className="shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4 overflow-x-auto"
          style={{
            maxHeight: "280px",
          }}
        >
          <div className="flex space-x-4 pb-2">
            {propertyListItems.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                variant="horizontal"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
