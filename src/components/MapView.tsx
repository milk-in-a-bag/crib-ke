"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PropertyListItem } from "@/types";

interface MapViewProps {
  properties: PropertyListItem[];
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  properties,
  center = [37.7749, -122.4194],
  zoom = 13,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    properties.forEach((property) => {
      const markerColor =
        property.price_type === "sale" ? "#3b82f6" : "#f97316";
      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: ${markerColor};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            white-space: nowrap;
          ">
            ${property.price_type === "rent" ? property.price.toLocaleString() : (property.price / 1000).toFixed(0) + "K"}
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      });

      const marker = L.marker([property.latitude, property.longitude], {
        icon,
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <img src="${property.images[0] ?? ""}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${property.title}</div>
          <div style="color: #7c3aed; font-weight: 700; font-size: 16px; margin-bottom: 4px;">
            ${property.price_type === "rent" ? property.price.toLocaleString() + "/mo" : property.price.toLocaleString()}
          </div>
          <div style="font-size: 12px; color: #64748b;">${property.neighborhood}, ${property.location}</div>
        </div>
      `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [properties, center, zoom]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
