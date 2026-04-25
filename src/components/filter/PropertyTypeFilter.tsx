"use client";
import {
  BuildingIcon,
  Building2Icon,
  HomeIcon,
  CastleIcon,
} from "lucide-react";

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment", icon: BuildingIcon },
  { id: "townhouse", label: "Townhouse", icon: Building2Icon },
  { id: "single-family", label: "Single Family", icon: HomeIcon },
  { id: "villa", label: "Villa", icon: CastleIcon },
];

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
}

export function PropertyTypeFilter({ selected, onToggle }: Readonly<Props>) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-4">Property type</h3>
      <div className="grid grid-cols-2 gap-3">
        {PROPERTY_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={`p-4 rounded-xl transition-all ${
              selected.includes(id)
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
  );
}
