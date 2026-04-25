"use client";
import { useState, useEffect, useRef } from "react";
import { PropertyTypeFilter } from "./filter/PropertyTypeFilter";
import { RoomFilter } from "./filter/RoomFilter";

export interface FilterState {
  types: string[];
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  minSqft: number;
  maxSqft: number;
}

export const DEFAULT_FILTERS: FilterState = {
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

export function FilterSidebar({
  onFilterChange,
}: Readonly<FilterSidebarProps>) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [priceSlider, setPriceSlider] = useState(300000);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const cbRef = useRef(onFilterChange);

  useEffect(() => {
    cbRef.current = onFilterChange;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    cbRef.current?.(filters);
  }, [filters]);

  const set = (patch: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const handlePriceSlider = (value: number) => {
    setPriceSlider(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => set({ maxPrice: value >= 300000 ? 0 : value }),
      300,
    );
  };

  const handleReset = () => {
    setPriceSlider(300000);
    setFilters(DEFAULT_FILTERS);
  };

  const priceLabel =
    priceSlider >= 300000
      ? "Any price"
      : `KES 0 – KES ${priceSlider.toLocaleString()}`;

  return (
    <div className="w-80 bg-slate-900 text-white p-6 h-screen overflow-y-auto">
      <PropertyTypeFilter
        selected={filters.types}
        onToggle={(id) =>
          set({
            types: filters.types.includes(id)
              ? filters.types.filter((t) => t !== id)
              : [...filters.types, id],
          })
        }
      />

      {/* Price range */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Price Range</h3>
        <div className="text-sm text-slate-400 mb-4">{priceLabel}</div>
        <input
          type="range"
          min="0"
          max="300000"
          step="5000"
          value={priceSlider}
          onChange={(e) => handlePriceSlider(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
      </div>

      <RoomFilter
        bedrooms={filters.bedrooms}
        bathrooms={filters.bathrooms}
        onBedroomsChange={(v) => set({ bedrooms: v })}
        onBathroomsChange={(v) => set({ bathrooms: v })}
      />

      <button
        onClick={handleReset}
        className="w-full px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
      >
        Reset filters
      </button>
    </div>
  );
}
