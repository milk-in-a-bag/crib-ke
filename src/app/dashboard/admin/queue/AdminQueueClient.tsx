"use client";

import { useState } from "react";
import {
  MapPinIcon,
  UserIcon,
  BedDoubleIcon,
  BathIcon,
  RulerIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  ChevronRightIcon,
  HomeIcon,
  MailIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AdminQueueListing } from "@/components/AdminReviewCard";
import type { PropertyType, PriceType } from "@/types";

interface AdminQueueClientProps {
  initialListings: AdminQueueListing[];
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

const priceTypeLabels: Record<PriceType, string> = {
  rent: "per month",
  sale: "for sale",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminQueueClient({ initialListings }: AdminQueueClientProps) {
  const [listings, setListings] = useState(initialListings);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialListings[0]?.id ?? null,
  );
  const [activeImage, setActiveImage] = useState(0);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = listings.find((l) => l.id === selectedId) ?? null;

  function selectListing(id: string) {
    setSelectedId(id);
    setActiveImage(0);
    setShowRejectForm(false);
    setReason("");
    setError(null);
  }

  function removeAndAdvance(id: string) {
    const idx = listings.findIndex((l) => l.id === id);
    const next = listings.find((l, i) => i !== idx) ?? null;
    setListings((prev) => prev.filter((l) => l.id !== id));
    setSelectedId(next?.id ?? null);
    setActiveImage(0);
    setShowRejectForm(false);
    setReason("");
    setError(null);
    setLoading(null);
  }

  async function handleApprove() {
    if (!selected) return;
    setLoading("approve");
    setError(null);
    try {
      const res = await fetch(`/api/listings/${selected.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to approve listing");
      }
      removeAndAdvance(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
      setLoading(null);
    }
  }

  async function handleReject() {
    if (!selected || !reason.trim()) return;
    setLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/listings/${selected.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to reject listing");
      }
      removeAndAdvance(selected.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
      setLoading(null);
    }
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
    <div className="flex gap-6 items-start">
      {/* ── Left: queue list ── */}
      <div className="w-72 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Pending ({listings.length})
          </p>
        </div>
        <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {listings.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => selectListing(l.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  l.id === selectedId
                    ? "bg-orange-50 dark:bg-orange-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {l.images[0] ? (
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HomeIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {l.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {l.neighborhood}, {l.location}
                  </p>
                  <p className="text-xs font-medium text-orange-500 mt-0.5">
                    {formatPrice(l.price, l.price_type)}
                  </p>
                </div>
                <ChevronRightIcon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    l.id === selectedId
                      ? "text-orange-500"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right: detail panel ── */}
      {selected ? (
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Image gallery */}
          <div className="relative bg-gray-900">
            <div className="h-72 overflow-hidden">
              {selected.images[activeImage] ? (
                <img
                  src={selected.images[activeImage]}
                  alt={`${selected.title} photo ${activeImage + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <HomeIcon className="w-16 h-16" />
                </div>
              )}
            </div>
            {selected.images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {selected.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === activeImage ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
            {selected.images.length > 1 && (
              <div className="absolute bottom-3 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {activeImage + 1} / {selected.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {selected.images.length > 1 && (
            <div className="flex gap-2 px-6 py-3 overflow-x-auto bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
              {selected.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImage
                      ? "border-orange-500"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={src}
                    alt={`thumb ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selected.title}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {typeLabels[selected.type] ?? selected.type}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {selected.availability_status}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-orange-500">
                  {formatPrice(selected.price, selected.price_type)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {priceTypeLabels[selected.price_type]}
                </p>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: BedDoubleIcon,
                  label: "Bedrooms",
                  value: selected.bedrooms,
                },
                {
                  icon: BathIcon,
                  label: "Bathrooms",
                  value: selected.bathrooms,
                },
                {
                  icon: RulerIcon,
                  label: "Size",
                  value: selected.sqft ? `${selected.sqft} sqft` : "—",
                },
                {
                  icon: MapPinIcon,
                  label: "Location",
                  value: `${selected.neighborhood}, ${selected.location}`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            {selected.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {selected.amenities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.amenities.map((a) => (
                    <span
                      key={a}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full capitalize"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner + submitted date */}
            <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selected.owner_name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MailIcon className="w-3 h-3" />
                    {selected.owner_email}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <CalendarIcon className="w-3 h-3" />
                  Submitted {formatDate(selected.created_at)}
                </div>
              </div>
            </div>

            {/* Actions */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {showRejectForm ? (
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rejection reason
                </h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this listing is being rejected. The owner will see this message."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!reason.trim() || loading === "reject"}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                    {loading === "reject" ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setReason("");
                      setError(null);
                    }}
                    disabled={loading === "reject"}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading !== null}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  {loading === "approve" ? "Approving…" : "Approve listing"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(true);
                    setError(null);
                  }}
                  disabled={loading !== null}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-50 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                  Reject listing
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
