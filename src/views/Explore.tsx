"use client";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { FilterSidebar } from "../components/FilterSidebar";
import type { FilterState } from "../components/FilterSidebar";
import { PropertyCard } from "../components/PropertyCard";
import type { PropertyListItem, ListResponse } from "@/types";
import { ChevronDownIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MapView = dynamic(
  () => import("../components/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse" />,
  },
);

const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219];

interface ExploreProps {
  initialProperties?: PropertyListItem[];
  initialTotal?: number;
  initialSearchParams?: Record<string, string>;
}

export function Explore({
  initialProperties = [],
  initialTotal = 0,
  initialSearchParams = {},
}: ExploreProps) {
  const [properties, setProperties] =
    useState<PropertyListItem[]>(initialProperties);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<"buy" | "rent">(
    (initialSearchParams.price_type as "buy" | "rent") ?? "buy",
  );
  const [sortBy, setSortBy] = useState(initialSearchParams.sort ?? "newest");
  const [query, setQuery] = useState(initialSearchParams.q ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const fetchProperties = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ...(query ? { q: query } : {}),
          sort: sortBy,
          ...overrides,
        });
        const res = await fetch(`/api/properties?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch properties");
        const json: ListResponse<PropertyListItem> = await res.json();
        setProperties(json.data);
        setTotal(json.total);
      } catch (err) {
        console.error("Explore fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [query, sortBy],
  );

  // Re-fetch when sort or search type changes
  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handleSearch = () => {
    fetchProperties();
  };

  const handleFilterChange = (filters: FilterState) => {
    const overrides: Record<string, string> = {};
    if (filters.minPrice > 0) overrides.min_price = String(filters.minPrice);
    if (filters.maxPrice > 0 && filters.maxPrice < 2000000)
      overrides.max_price = String(filters.maxPrice);
    if (filters.bedrooms > 0) overrides.bedrooms = String(filters.bedrooms);
    if (filters.bathrooms > 0) overrides.bathrooms = String(filters.bathrooms);
    // Map sidebar type selections to DB property_type enum values
    if (filters.types.length > 0) {
      const typeMap: Record<string, string[]> = {
        apartment: [
          "bedsitter",
          "one_bedroom",
          "two_bedroom",
          "three_bedroom",
          "studio",
        ],
        townhouse: ["townhouse"],
        "single-family": ["three_bedroom"],
        villa: ["villa"],
      };
      // Use the first selected type's first DB mapping
      const mapped = typeMap[filters.types[0]]?.[0];
      if (mapped) overrides.type = mapped;
    }
    fetchProperties(overrides);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] relative">
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:block shrink-0">
        <FilterSidebar onFilterChange={handleFilterChange} />
      </div>

      {/* Mobile filter overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="relative">
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
                <FilterSidebar onFilterChange={handleFilterChange} />
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search Nairobi neighborhoods..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-accent transition-colors text-sm"
          />

          <div className="relative hidden sm:block shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 font-semibold text-sm cursor-pointer hover:border-accent transition-colors"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="best_match">Best Match</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {total > 0 && (
            <span className="hidden sm:block text-sm text-slate-500 shrink-0">
              {total} listing{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Map - takes all remaining space */}
        <div className="flex-1 min-h-0 relative" style={{ minHeight: "300px" }}>
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <MapView properties={properties} center={NAIROBI_CENTER} zoom={12} />
        </div>

        {/* Property cards strip - fixed height */}
        <div
          className="shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4 overflow-x-auto"
          style={{ maxHeight: "280px" }}
        >
          {properties.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-20 text-slate-400 text-sm">
              No properties found. Try adjusting your filters.
            </div>
          ) : (
            <div className="flex space-x-4 pb-2">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  variant="horizontal"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
