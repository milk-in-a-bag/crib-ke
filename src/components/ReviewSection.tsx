"use client";
import React, { useState } from "react";
import {
  StarIcon,
  ThumbsUpIcon,
  BadgeCheckIcon,
  UserCircleIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { DbReview } from "../types/index";

interface ReviewSectionProps {
  readonly reviews: DbReview[];
  readonly overallRating: number;
  readonly reviewCount: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ReviewSection({
  reviews,
  overallRating,
  reviewCount,
}: ReviewSectionProps) {
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(reviews.map((r) => [r.id, r.helpful_count ?? 0])),
  );
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>(
    {},
  );

  async function handleHelpful(reviewId: string) {
    if (helpfulClicked[reviewId]) return;
    // Optimistic update
    setHelpfulCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? 0) + 1,
    }));
    setHelpfulClicked((prev) => ({ ...prev, [reviewId]: true }));

    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setHelpfulCounts((prev) => ({
          ...prev,
          [reviewId]: json.data?.helpful_count ?? prev[reviewId],
        }));
      } else {
        // Revert on failure
        setHelpfulCounts((prev) => ({
          ...prev,
          [reviewId]: (prev[reviewId] ?? 1) - 1,
        }));
        setHelpfulClicked((prev) => ({ ...prev, [reviewId]: false }));
      }
    } catch {
      // Revert on error
      setHelpfulCounts((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] ?? 1) - 1,
      }));
      setHelpfulClicked((prev) => ({ ...prev, [reviewId]: false }));
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <BadgeCheckIcon className="w-7 h-7 text-emerald-500" />
        <h2 className="text-2xl font-bold text-primary">
          Verified Tenant Reviews
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center space-y-6 sm:space-y-0 sm:space-x-6 mb-8 pb-6 border-b border-slate-200">
        <div className="text-center sm:text-left">
          <div className="text-5xl font-bold text-primary mb-2">
            {overallRating}
          </div>
          <div className="flex items-center justify-center sm:justify-start mb-1">
            {[...new Array(5)].map((_, i) => (
              <StarIcon
                key={`overall-star-${i}`}
                className={`w-5 h-5 ${i < Math.floor(overallRating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
              />
            ))}
          </div>
          <div className="text-sm text-slate-500">{reviewCount} reviews</div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            className="border-b border-slate-200 pb-6 last:border-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start space-x-4">
              {review.author_avatar ? (
                <img
                  src={review.author_avatar}
                  alt={review.author_name ?? "Reviewer"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-12 h-12 text-slate-300 shrink-0" />
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary">
                        {review.author_name ?? "Anonymous"}
                      </span>
                      {review.verified_tenant && (
                        <BadgeCheckIcon className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      {review.verified_tenant && <span>Verified Tenant</span>}
                      <span>• {formatDate(review.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...new Array(5)].map((_, i) => (
                      <StarIcon
                        key={`review-star-${review.id}-${i}`}
                        className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 mb-3">{review.comment}</p>
                <button
                  onClick={() => handleHelpful(review.id)}
                  disabled={helpfulClicked[review.id]}
                  className={`flex items-center space-x-2 text-sm transition-colors ${
                    helpfulClicked[review.id]
                      ? "text-accent cursor-default"
                      : "text-slate-500 hover:text-accent"
                  }`}
                >
                  <ThumbsUpIcon className="w-4 h-4" />
                  <span>Helpful ({helpfulCounts[review.id] ?? 0})</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
