"use client";
import { MapPinIcon } from "lucide-react";

interface Props {
  active: boolean;
  loading: boolean;
  error: string | null;
  radiusKm: number;
  onToggle: () => void;
  onRadiusChange: (km: number) => void;
}

export function NearMeFilter({
  active,
  loading,
  error,
  radiusKm,
  onToggle,
  onRadiusChange,
}: Readonly<Props>) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-4">Location</h3>
      <button
        onClick={onToggle}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
          active
            ? "bg-orange-500 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <MapPinIcon className="w-4 h-4" />
        )}
        {active ? "Near me (on)" : "Near me"}
      </button>

      {active && (
        <div className="mt-3">
          <span className="text-xs text-slate-400 block mb-1">
            Radius: {radiusKm} km
          </span>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={radiusKm}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400 leading-snug">{error}</p>
      )}
    </div>
  );
}
