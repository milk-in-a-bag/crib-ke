"use client";
import React, { useState } from "react";
import { MapPinIcon, HomeIcon, UserIcon, CheckIcon, XIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { PropertyType, PriceType } from "@/types";

export interface AdminQueueListing {
  id: string;
  title: string;
  type: PropertyType;
  price: number;
  price_type: PriceType;
  neighborhood: string;
  location: string;
  images: string[];
  owner_name: string;
  created_at: string;
}

interface AdminReviewCardProps {
  listing: AdminQueueListing;
  onRemove: (id: string) => void;
}

const typeLabels: Record<PropertyType, string> = {
  bedsitter: "Bedsitter",
  one_bedroom: "1 Bedroom",
  two_bedroom: "2 Bedroom",
  three_bedroom: "3 Bedroom",
  studio: "Studio",
  villa: "Villa",
  townhouse: "Townhouse",
};

export function AdminReviewCard({ listing, onRemove }: AdminReviewCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to approve listing");
      }
      onRemove(listing.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to reject listing");
      }
      onRemove(listing.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  const previewImages = listing.images.slice(0, 3);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Image strip */}
      <div className="flex h-40 gap-0.5 bg-gray-100 dark:bg-gray-700">
        {previewImages.length > 0 ? (
          previewImages.map((src, i) => (
            <div
              key={src}
              className="flex-1 overflow-hidden"
              style={{ flexBasis: `${100 / previewImages.length}%` }}
            >
              <img
                src={src}
                alt={`${listing.title} photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <HomeIcon className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
              {listing.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {typeLabels[listing.type] ?? listing.type}
            </p>
          </div>
          <span className="font-bold text-orange-500 text-base whitespace-nowrap">
            {formatPrice(listing.price, listing.price_type)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-4 h-4 shrink-0" />
            {listing.neighborhood}, {listing.location}
          </span>
          <span className="flex items-center gap-1">
            <UserIcon className="w-4 h-4 shrink-0" />
            {listing.owner_name}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
        )}

        {showRejectForm ? (
          <div className="space-y-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!reason.trim() || loading === "reject"}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <XIcon className="w-4 h-4" />
                {loading === "reject" ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setReason("");
                  setError(null);
                }}
                disabled={loading === "reject"}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              {loading === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(true);
                setError(null);
              }}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-50 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg transition-colors"
            >
              <XIcon className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
