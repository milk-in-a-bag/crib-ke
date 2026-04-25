"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PropertyListItem } from "@/types";

interface MapViewProps {
  properties: PropertyListItem[];
  center?: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  onLocate?: () => void;
}

export function MapView({
  properties,
  center = [-1.2921, 36.8219],
  zoom = 13,
  userLocation,
  onLocate,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers whenever properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    properties.forEach((property) => {
      const markerColor =
        property.price_type === "sale" ? "#3b82f6" : "#f97316";
      const label =
        property.price_type === "rent"
          ? property.price.toLocaleString()
          : (property.price / 1_000_000).toFixed(1) + "M";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
            background-color: ${markerColor};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            white-space: nowrap;
          ">${label}</div>`,
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      });

      const marker = L.marker([property.latitude, property.longitude], {
        icon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <img src="${property.images[0] ?? ""}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />
          <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${property.title}</div>
          <div style="color:#7c3aed;font-weight:700;font-size:16px;margin-bottom:4px;">
            KES ${property.price_type === "rent" ? property.price.toLocaleString() + "/mo" : property.price.toLocaleString()}
          </div>
          <div style="font-size:12px;color:#64748b;">${property.neighborhood}, ${property.location}</div>
        </div>
      `);

      markersRef.current.push(marker);
    });
  }, [properties]);

  // Update user location marker + radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old user marker and circle
    userMarkerRef.current?.remove();

    if (!userLocation) return;

    // Blue dot for user position
    userMarkerRef.current = L.circleMarker(userLocation, {
      radius: 8,
      fillColor: "#3b82f6",
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    // Fly to user location
    map.flyTo(userLocation, 13, { duration: 1.2 });
  }, [userLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
      {/* Locate me button */}
      {onLocate && (
        <button
          onClick={onLocate}
          title="Center on my location"
          className="absolute bottom-6 right-3 z-[999] w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-slate-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" strokeOpacity="0.3" />
          </svg>
        </button>
      )}
    </div>
  );
}
