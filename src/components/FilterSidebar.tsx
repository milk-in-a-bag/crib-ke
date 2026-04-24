"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  Building2Icon,
  BuildingIcon,
  CastleIcon,
} from "lucide-react";

export interface FilterState {
  types: string[];
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  minSqft: number;
  maxSqft: number;
}

const DEFAULT_FILTERS: FilterState = {
  types: [],
  minPrice: 0,
  maxPrice: 0,
  bedrooms: 0,
  bathrooms: 0,
  minSqft: 0,
  maxSqft: 5000,
};

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
}

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment", icon: BuildingIcon },
  { id: "townhouse", label: "Townhouse", icon: Building2Icon },
  { id: "single-family", label: "Single Family", icon: HomeIcon },
  { id: "villa", label: "Villa", icon: CastleIcon },
];

const ROOM_OPTIONS = ["Any", 1, 2, 3, 4, "4+"] as const;

function roomValue(opt: (typeof ROOM_OPTIONS)[number]): number {
  if (opt === "Any") return 0;
  if (opt === "4+") return 5;
  return opt;
}

export function FilterSidebar({
  onFilterChange,
}: Readonly<FilterSidebarProps>) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [priceSlider, setPriceSlider] = useState(2000000);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  // Keep callback in a ref so it never causes the effect to re-run
  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  });

  // Notify parent whenever filters change (skip the very first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onFilterChangeRef.current?.(filters);
  }, [filters]); // ← only filters, never the callback

  // Debounce price slider so we don't fire on every pixel
  const handlePriceSlider = (value: number) => {
    setPriceSlider(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        maxPrice: value >= 2000000 ? 0 : value,
      }));
    }, 300);
  };

  const toggleType = (id: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(id)
        ? prev.types.filter((t) => t !== id)
        : [...prev.types, id],
    }));
  };

  const handleReset = () => {
    setPriceSlider(2000000);
    setFilters(DEFAULT_FILTERS);
  };

  const priceLabel =
    priceSlider >= 2000000
      ? "Any price"
      : `KES ${(0).toLocaleString()} – KES ${priceSlider.toLocaleString()}`;

  return (
    <div className="w-80 bg-slate-900 text-white p-6 h-screen overflow-y-auto">
      {/* Property type */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Property type</h3>
        <div className="grid grid-cols-2 gap-3">
          {PROPERTY_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => toggleType(id)}
              className={`p-4 rounded-xl transition-all ${
                filters.types.includes(id)
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-xs font-medium">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Price Range</h3>
        <div className="text-sm text-slate-400 mb-4">{priceLabel}</div>
        <input
          type="range"
          min="0"
          max="2000000"
          step="5000"
          value={priceSlider}
          onChange={(e) => handlePriceSlider(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Bedrooms */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Property Room</h3>
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-2">Bedroom</div>
          <div className="flex space-x-2 flex-wrap gap-y-2">
            {ROOM_OPTIONS.map((opt) => {
              const val = roomValue(opt);
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, bedrooms: val }))
                  }
                  className={`px-3 py-2 rounded-lg transition-all text-sm ${
                    filters.bedrooms === val
                      ? "bg-white text-slate-900"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-2">Bathroom</div>
          <div className="flex space-x-2 flex-wrap gap-y-2">
            {ROOM_OPTIONS.map((opt) => {
              const val = roomValue(opt);
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, bathrooms: val }))
                  }
                  className={`px-3 py-2 rounded-lg transition-all text-sm ${
                    filters.bathrooms === val
                      ? "bg-white text-slate-900"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Availability</h3>
        <div className="space-y-3">
          {[
            { id: "ready", label: "Ready to move" },
            { id: "6months", label: "Within 6 months" },
            { id: "1year", label: "Within 1 year" },
            { id: "more", label: "More than 1 year" },
          ].map(({ id, label }) => (
            <label
              key={id}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                name="availability"
                value={id}
                className="w-4 h-4 accent-orange-500"
                readOnly
              />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset only — no Apply needed */}
      <button
        onClick={handleReset}
        className="w-full px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
      >
        Reset filters
      </button>
    </div>
  );
}
