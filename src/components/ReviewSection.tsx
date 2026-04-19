"use client";
import React from "react";
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ThumbsUpIcon,
  BadgeCheckIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Review } from "../data/reviews";
interface ReviewSectionProps {
  reviews: Review[];
  overallRating: number;
  reviewCount: number;
}
export function ReviewSection({
  reviews,
  overallRating,
  reviewCount,
}: ReviewSectionProps) {
  const allPros = Array.from(new Set(reviews.flatMap((r) => r.pros))).slice(
    0,
    4,
  );
  const allCons = Array.from(new Set(reviews.flatMap((r) => r.cons))).slice(
    0,
    3,
  );
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
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-5 h-5 ${i < Math.floor(overallRating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
              />
            ))}
          </div>
          <div className="text-sm text-slate-500">{reviewCount} reviews</div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold text-sm text-slate-700 mb-2">
              Top Pros
            </div>
            <div className="space-y-1">
              {allPros.map((pro, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-2 text-sm text-emerald-600"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-700 mb-2">
              Common Cons
            </div>
            <div className="space-y-1">
              {allCons.map((con, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-2 text-sm text-rose-600"
                >
                  <XCircleIcon className="w-4 h-4" />
                  <span>{con}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            className="border-b border-slate-200 pb-6 last:border-0"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.1,
            }}
          >
            <div className="flex items-start space-x-4">
              <img
                src={review.avatar}
                alt={review.author}
                className="w-12 h-12 rounded-full"
              />

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-primary">
                        {review.author}
                      </span>
                      {review.verified && (
                        <BadgeCheckIcon className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span>Verified Tenant</span>
                      {review.tenureYears && (
                        <span>• Lived here {review.tenureYears}+ years</span>
                      )}
                      <span>• {review.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 mb-3">{review.text}</p>
                <button className="flex items-center space-x-2 text-sm text-slate-500 hover:text-accent transition-colors">
                  <ThumbsUpIcon className="w-4 h-4" />
                  <span>Helpful ({review.helpful})</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
