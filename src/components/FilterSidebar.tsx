"use client";
import { useState, useEffect, useRef } from "react";
import { BookmarkIcon, XIcon } from "lucide-react";
import { PropertyTypeFilter } from "./filter/PropertyTypeFilter";
import { RoomFilter } from "./filter/RoomFilter";
import { NearMeFilter } from "./filter/NearMeFilter";

export interface FilterState {
  types: string[];
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  bathrooms: number;
  minSqft: number;
  maxSqft: number;
  minPricePerSqft: number;
  maxPricePerSqft: number;
  nearMe: boolean;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
}

export const DEFAULT_FILTERS: FilterState = {
  types: [],
  minPrice: 0,
  maxPrice: 0,
  bedrooms: 0,
  bathrooms: 0,
  minSqft: 0,
  maxSqft: 5000,
  minPricePerSqft: 0,
  maxPricePerSqft: 0,
  nearMe: false,
  lat: null,
  lng: null,
  radiusKm: 5,
};

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
  onSaveSearch?: (name: string) => void;
}

function hasActiveFilters(f: FilterState) {
  return (
    f.types.length > 0 ||
    f.minPrice > 0 ||
    f.maxPrice > 0 ||
    f.bedrooms > 0 ||
    f.bathrooms > 0 ||
    f.minPricePerSqft > 0 ||
    f.maxPricePerSqft > 0 ||
    f.nearMe
  );
}

export function FilterSidebar({
  onFilterChange,
  onSaveSearch,
}: Readonly<FilterSidebarProps>) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [priceSlider, setPriceSlider] = useState(2000000);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const cbRef = useRef(onFilterChange);
  const saveRef = useRef(onSaveSearch);
  useEffect(() => {
    cbRef.current = onFilterChange;
    saveRef.current = onSaveSearch;
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
      () => set({ maxPrice: value >= 2000000 ? 0 : value }),
      300,
    );
  };

  const handleNearMeToggle = () => {
    if (filters.nearMe) {
      set({ nearMe: false, lat: null, lng: null });
      setGeoError(null);
      return;
    }
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        set({
          nearMe: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError(
          'Location access is required for the "Near me" feature. Please allow location access and try again.',
        );
      },
    );
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      saveRef.current?.(saveName.trim());
      setShowSaveInput(false);
      setSaveName("");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPriceSlider(2000000);
    setFilters(DEFAULT_FILTERS);
    setGeoError(null);
    setShowSaveInput(false);
    setSaveName("");
  };

  const priceLabel =
    priceSlider >= 2000000
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
          max="2000000"
          step="5000"
          value={priceSlider}
          onChange={(e) => handlePriceSlider(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Price per sqft */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Price per sqft (KES)</h3>
        <div className="flex gap-2">
          {(["minPricePerSqft", "maxPricePerSqft"] as const).map((key, i) => (
            <div key={key} className="flex-1">
              <span className="text-xs text-slate-400 mb-1 block">
                {i === 0 ? "Min" : "Max"}
              </span>
              <input
                type="number"
                min="0"
                placeholder={i === 0 ? "0" : "Any"}
                value={filters[key] || ""}
                onChange={(e) =>
                  set({ [key]: e.target.value ? Number(e.target.value) : 0 })
                }
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          ))}
        </div>
      </div>

      <RoomFilter
        bedrooms={filters.bedrooms}
        bathrooms={filters.bathrooms}
        onBedroomsChange={(v) => set({ bedrooms: v })}
        onBathroomsChange={(v) => set({ bathrooms: v })}
      />

      <NearMeFilter
        active={filters.nearMe}
        loading={geoLoading}
        error={geoError}
        radiusKm={filters.radiusKm}
        onToggle={handleNearMeToggle}
        onRadiusChange={(km) => set({ radiusKm: km })}
      />

      {/* Save this search */}
      {onSaveSearch && (
        <div className="mb-4">
          {showSaveInput ? (
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Name this search</span>
                <button
                  onClick={() => {
                    setShowSaveInput(false);
                    setSaveName("");
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSaveSearch()}
                placeholder="e.g. 2BR in Westlands"
                autoFocus
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 mb-2"
              />
              <button
                onClick={() => void handleSaveSearch()}
                disabled={!saveName.trim() || saving}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save search"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              disabled={!hasActiveFilters(filters)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookmarkIcon className="w-4 h-4" />
              Save this search
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleReset}
        className="w-full px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
      >
        Reset filters
      </button>
    </div>
  );
}
