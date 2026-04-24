"use client";
import React, { useState } from "react";
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

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([1000, 850000]);
  const [bedrooms, setBedrooms] = useState(4);
  const [bathrooms, setBathrooms] = useState(2);
  const [propertySize, setPropertySize] = useState([0, 5000]);
  const [availability, setAvailability] = useState("ready");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["apartment"]);

  const propertyTypes = [
    { id: "apartment", label: "Apartment", icon: BuildingIcon },
    { id: "townhouse", label: "Townhouse", icon: Building2Icon },
    { id: "single-family", label: "Single Family", icon: HomeIcon },
    { id: "villa", label: "Villa", icon: CastleIcon },
  ];

  const togglePropertyType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({
        types: selectedTypes,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        bedrooms,
        bathrooms,
        minSqft: propertySize[0],
        maxSqft: propertySize[1],
      });
    }
  };

  const handleReset = () => {
    setPriceRange([1000, 850000]);
    setBedrooms(4);
    setBathrooms(2);
    setPropertySize([0, 5000]);
    setAvailability("ready");
    setSelectedTypes(["apartment"]);
    if (onFilterChange) {
      onFilterChange({
        types: ["apartment"],
        minPrice: 1000,
        maxPrice: 850000,
        bedrooms: 4,
        bathrooms: 2,
        minSqft: 0,
        maxSqft: 5000,
      });
    }
  };

  return (
    <div className="w-80 bg-slate-900 text-white p-6 h-screen overflow-y-auto">
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Property type</h3>
        <div className="grid grid-cols-2 gap-3">
          {propertyTypes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => togglePropertyType(id)}
              className={`p-4 rounded-xl transition-all ${selectedTypes.includes(id) ? "bg-white text-slate-900" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-xs font-medium">{label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Price Range</h3>
        <div className="text-sm text-slate-400 mb-4">
          KES {priceRange[0].toLocaleString()} - KES{" "}
          {priceRange[1].toLocaleString()}
        </div>
        <input
          type="range"
          min="500"
          max="2000000"
          value={priceRange[1]}
          onChange={(e) =>
            setPriceRange([priceRange[0], parseInt(e.target.value)])
          }
          className="w-full accent-orange-500"
        />
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Property Room</h3>
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-2">Bedroom</div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, "4+"].map((num) => (
              <button
                key={num}
                onClick={() => setBedrooms(typeof num === "number" ? num : 5)}
                className={`px-4 py-2 rounded-lg transition-all ${bedrooms === (typeof num === "number" ? num : 5) ? "bg-white text-slate-900" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-2">Bathroom</div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, "4+"].map((num) => (
              <button
                key={num}
                onClick={() => setBathrooms(typeof num === "number" ? num : 5)}
                className={`px-4 py-2 rounded-lg transition-all ${bathrooms === (typeof num === "number" ? num : 5) ? "bg-white text-slate-900" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                checked={availability === id}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Property Size</h3>
        <div className="text-sm text-slate-400 mb-4">
          {propertySize[0]} - {propertySize[1].toLocaleString()} sqft
        </div>
        <input
          type="range"
          min="0"
          max="5000"
          value={propertySize[1]}
          onChange={(e) => setPropertySize([0, parseInt(e.target.value)])}
          className="w-full accent-orange-500"
        />
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
