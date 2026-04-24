"use client";
import React, { useState } from "react";
import {
  AdminReviewCard,
  type AdminQueueListing,
} from "@/components/AdminReviewCard";

interface AdminQueueClientProps {
  initialListings: AdminQueueListing[];
}

export function AdminQueueClient({ initialListings }: AdminQueueClientProps) {
  const [listings, setListings] = useState(initialListings);

  function handleRemove(id: string) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <p className="text-gray-400 dark:text-gray-500 text-lg">
          No listings pending review
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          All caught up — check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <AdminReviewCard
          key={listing.id}
          listing={listing}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
