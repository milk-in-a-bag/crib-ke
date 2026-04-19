"use client";
import React, { useState } from "react";
import { SearchIcon, MapPinIcon } from "lucide-react";
interface SearchBarProps {
  variant?: "hero" | "compact";
}
export function SearchBar({ variant = "hero" }: SearchBarProps) {
  const [searchType, setSearchType] = useState<"buy" | "rent">("buy");
  const [location, setLocation] = useState("");
  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-2 bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm">
        <SearchIcon className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by location..."
          className="flex-1 outline-none text-sm"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="w-full max-w-3xl px-2 sm:px-0">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <button
          onClick={() => setSearchType("buy")}
          className={`px-5 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base transition-all ${searchType === "buy" ? "bg-accent text-white shadow-lg shadow-accent/30" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"}`}
        >
          Buy
        </button>
        <button
          onClick={() => setSearchType("rent")}
          className={`px-5 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base transition-all ${searchType === "rent" ? "bg-accent text-white shadow-lg shadow-accent/30" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"}`}
        >
          Rent
        </button>
      </div>

      {/* Desktop: horizontal bar */}
      <div className="hidden sm:flex items-center bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex-1 flex items-center px-5 py-4 border-r border-slate-200">
          <MapPinIcon className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Enter location, neighborhood, or address"
            className="flex-1 outline-none text-slate-900 placeholder-slate-400"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button className="px-8 py-4 bg-accent text-white font-semibold hover:bg-accent-hover transition-colors flex items-center space-x-2 shrink-0">
          <SearchIcon className="w-5 h-5" />
          <span>Search</span>
        </button>
      </div>

      {/* Mobile: stacked layout */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center bg-white rounded-xl shadow-lg px-4 py-3.5">
          <MapPinIcon className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Enter location or address"
            className="flex-1 outline-none text-slate-900 placeholder-slate-400 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-accent/30">
          <SearchIcon className="w-5 h-5" />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
}
