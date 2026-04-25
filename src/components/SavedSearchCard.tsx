"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon, TrashIcon, ArrowRightIcon } from "lucide-react";
import type { SavedSearch, SearchFilters } from "@/types";

interface SavedSearchCardProps {
  readonly savedSearch: SavedSearch;
  readonly onDelete: (id: string) => void;
}

function formatFilterSummary(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.q) parts.push(`"${filters.q}"`);

  if (filters.type) {
    const typeLabels: Record<string, string> = {
      bedsitter: "Bedsitter",
      one_bedroom: "1 Bedroom",
      two_bedroom: "2 Bedrooms",
      three_bedroom: "3 Bedrooms",
      studio: "Studio",
      villa: "Villa",
      townhouse: "Townhouse",
    };
    parts.push(typeLabels[filters.type] ?? filters.type);
  }

  if (filters.price_type) {
    parts.push(filters.price_type === "rent" ? "For Rent" : "For Sale");
  }

  if (filters.min_price && filters.max_price) {
    parts.push(
      `KES ${filters.min_price.toLocaleString()} – ${filters.max_price.toLocaleString()}`,
    );
  } else if (filters.min_price) {
    parts.push(`From KES ${filters.min_price.toLocaleString()}`);
  } else if (filters.max_price) {
    parts.push(`Up to KES ${filters.max_price.toLocaleString()}`);
  }

  if (filters.bedrooms) parts.push(`${filters.bedrooms}+ beds`);
  if (filters.bathrooms) parts.push(`${filters.bathrooms}+ baths`);

  if (filters.min_price_per_sqft || filters.max_price_per_sqft) {
    const min = filters.min_price_per_sqft ?? 0;
    const max = filters.max_price_per_sqft;
    if (min && max) {
      parts.push(`KES ${min}–${max}/sqft`);
    } else if (min) {
      parts.push(`From KES ${min}/sqft`);
    } else if (max) {
      parts.push(`Up to KES ${max}/sqft`);
    }
  }

  if (filters.radius_km && filters.lat && filters.lng) {
    parts.push(`Within ${filters.radius_km} km`);
  }

  if (filters.amenities && filters.amenities.length > 0) {
    parts.push(filters.amenities.join(", "));
  }

  return parts.length > 0 ? parts.join(" · ") : "All properties";
}

function filtersToQueryParams(filters: SearchFilters): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.price_type) params.set("price_type", filters.price_type);
  if (filters.min_price) params.set("min_price", String(filters.min_price));
  if (filters.max_price) params.set("max_price", String(filters.max_price));
  if (filters.min_price_per_sqft)
    params.set("min_price_per_sqft", String(filters.min_price_per_sqft));
  if (filters.max_price_per_sqft)
    params.set("max_price_per_sqft", String(filters.max_price_per_sqft));
  if (filters.bedrooms) params.set("bedrooms", String(filters.bedrooms));
  if (filters.bathrooms) params.set("bathrooms", String(filters.bathrooms));
  if (filters.lat) params.set("lat", String(filters.lat));
  if (filters.lng) params.set("lng", String(filters.lng));
  if (filters.radius_km) params.set("radius_km", String(filters.radius_km));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.amenities && filters.amenities.length > 0)
    params.set("amenities", filters.amenities.join(","));

  return params.toString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SavedSearchCard({
  savedSearch,
  onDelete,
}: SavedSearchCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    const qs = filtersToQueryParams(savedSearch.filters);
    const url = qs ? `/explore?${qs}` : "/explore";
    router.push(url);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/saved-searches/${savedSearch.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDelete(savedSearch.id);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(
          (json as { error?: string }).error ??
            "Failed to delete. Please try again.",
        );
        setDeleting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <BookmarkIcon className="w-4 h-4 text-orange-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {savedSearch.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {formatFilterSummary(savedSearch.filters)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Saved {formatDate(savedSearch.created_at)}
            </p>
          </div>
        </div>

        <button
          onClick={() => void handleDelete()}
          disabled={deleting}
          aria-label="Delete saved search"
          className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        onClick={handleApply}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        Apply search
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
