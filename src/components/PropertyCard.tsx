"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPinIcon,
  StarIcon,
  BedIcon,
  BathIcon,
  SquareIcon,
} from "lucide-react";
import type { PropertyListItem } from "@/types/index";
import { formatPrice } from "@/lib/utils";
import { SaveButton } from "./SaveButton";

interface PropertyCardProps {
  property: PropertyListItem;
  variant?: "grid" | "horizontal";
  distanceKm?: number | null;
}

export function PropertyCard({
  property,
  variant = "grid",
  distanceKm = null,
}: PropertyCardProps) {
  const image = property.images?.[0] ?? "";

  if (variant === "horizontal") {
    return (
      <Link href={`/property/${property.id}`}>
        <motion.div
          className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden min-w-[280px] max-w-[300px]"
          whileHover={{ y: -4 }}
        >
          <div className="relative h-36">
            <img
              src={image}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  property.price_type === "sale"
                    ? "bg-blue-500 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                FOR {property.price_type === "sale" ? "SALE" : "RENT"}
              </span>
            </div>
            {distanceKm !== null && (
              <div className="absolute bottom-3 left-3">
                <span className="bg-white/90 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)}m away`
                    : `${distanceKm.toFixed(1)}km away`}
                </span>
              </div>
            )}
            <div className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm">
              <SaveButton propertyId={property.id} />
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-bold text-base text-primary">
                {formatPrice(property.price, property.price_type)}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-2 truncate">
              {property.neighborhood}, {property.location}
            </p>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <BedIcon className="w-4 h-4" />
                <span>{property.bedrooms} beds</span>
              </div>
              <div className="flex items-center space-x-1">
                <BathIcon className="w-4 h-4" />
                <span>{property.bathrooms} baths</span>
              </div>
              <div className="flex items-center space-x-1">
                <SquareIcon className="w-4 h-4" />
                <span>{property.sqft} sq ft</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/property/${property.id}`} className="h-full">
      <motion.div
        className="h-full bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
        whileHover={{ y: -8 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative h-64">
          <img
            src={image}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-md">
            <SaveButton propertyId={property.id} />
          </div>
        </div>

        <div className="p-5 flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xl text-primary">
                {property.title}
              </h3>
            </div>
            <span className="font-bold text-xl text-accent">
              {formatPrice(property.price, property.price_type)}
            </span>
          </div>

          <div className="flex items-center space-x-1 text-sm text-slate-600 mb-3">
            <MapPinIcon className="w-4 h-4" />
            <span>{property.location}</span>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            {property.rating != null && (
              <div className="flex items-center space-x-1">
                <StarIcon className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-slate-700">
                  {property.rating}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <BedIcon className="w-4 h-4" />
                <span>{property.bedrooms} Bed</span>
              </div>
              <div className="flex items-center space-x-1">
                <BathIcon className="w-4 h-4" />
                <span>{property.bathrooms} Bath</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
