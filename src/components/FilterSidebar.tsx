"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  Building2Icon,
  BuildingIcon,
  CastleIcon,
  MapPinIcon,
  BookmarkIcon,
  XIcon,
} from "lucide-react";

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

const DEFAULT_FILTERS: FilterState = {
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

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.types.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.bedrooms > 0 ||
    filters.bathrooms > 0 ||
    filters.minPricePerSqft > 0 ||
    filters.maxPricePerSqft > 0 ||
    filters.nearMe
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
  const onFilterChangeRef = useRef(onFilterChange);
  const onSaveSearchRef = useRef(onSaveSearch);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
    onSaveSearchRef.current = onSaveSearch;
  });

  // Notify parent whenever filters change (skip the very first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onFilterChangeRef.current?.(filters);
  }, [filters]);

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

  const handleNearMeToggle = () => {
    if (filters.nearMe) {
      // Turn off
      setFilters((prev) => ({
        ...prev,
        nearMe: false,
        lat: null,
        lng: null,
      }));
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
        setFilters((prev) => ({
          ...prev,
          nearMe: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
      },
      () => {
        setGeoLoading(false);
        setGeoError(
          'Location access is required for the "Near me" feature. Please allow location access in your browser and try again.',
        );
      },
    );
  };

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await onSaveSearchRef.current?.(saveName.trim());
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
      : `KES ${(0).toLocaleString()} – KES ${priceSlider.toLocaleString()}`;

  const active = hasActiveFilters(filters);

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

      {/* Price per sqft */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Price per sqft (KES)</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Min</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={filters.minPricePerSqft || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  minPricePerSqft: e.target.value ? Number(e.target.value) : 0,
                }))
              }
              className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1 block">Max</label>
            <input
              type="number"
              min="0"
              placeholder="Any"
              value={filters.maxPricePerSqft || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  maxPricePerSqft: e.target.value ? Number(e.target.value) : 0,
                }))
              }
              className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
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

      {/* Near me */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Location</h3>
        <button
          onClick={handleNearMeToggle}
          disabled={geoLoading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
            filters.nearMe
              ? "bg-orange-500 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {geoLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPinIcon className="w-4 h-4" />
          )}
          {filters.nearMe ? "Near me (on)" : "Near me"}
        </button>

        {filters.nearMe && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">
                Radius: {filters.radiusKm} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={filters.radiusKm}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  radiusKm: Number(e.target.value),
                }))
              }
              className="w-full accent-orange-500"
            />
          </div>
        )}

        {geoError && (
          <p className="mt-2 text-xs text-red-400 leading-snug">{geoError}</p>
        )}
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
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500 mb-2"
                autoFocus
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
              disabled={!active}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookmarkIcon className="w-4 h-4" />
              Save this search
            </button>
          )}
        </div>
      )}

      {/* Reset */}
      <button
        onClick={handleReset}
        className="w-full px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
      >
        Reset filters
      </button>
    </div>
  );
}
