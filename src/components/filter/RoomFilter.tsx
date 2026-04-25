"use client";

const ROOM_OPTIONS = ["Any", 1, 2, 3, 4, "4+"] as const;

export function roomValue(opt: (typeof ROOM_OPTIONS)[number]): number {
  if (opt === "Any") return 0;
  if (opt === "4+") return 5;
  return opt;
}

interface Props {
  bedrooms: number;
  bathrooms: number;
  onBedroomsChange: (val: number) => void;
  onBathroomsChange: (val: number) => void;
}

function RoomRow({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: number;
  onChange: (val: number) => void;
}>) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      <div className="flex space-x-2 flex-wrap gap-y-2">
        {ROOM_OPTIONS.map((opt) => {
          const val = roomValue(opt);
          return (
            <button
              key={opt}
              onClick={() => onChange(val)}
              className={`px-3 py-2 rounded-lg transition-all text-sm ${
                value === val
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
  );
}

export function RoomFilter({
  bedrooms,
  bathrooms,
  onBedroomsChange,
  onBathroomsChange,
}: Readonly<Props>) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold mb-4">Property Room</h3>
      <RoomRow label="Bedroom" value={bedrooms} onChange={onBedroomsChange} />
      <RoomRow
        label="Bathroom"
        value={bathrooms}
        onChange={onBathroomsChange}
      />
    </div>
  );
}
