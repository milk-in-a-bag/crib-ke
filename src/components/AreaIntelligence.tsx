"use client";
import React, { useEffect, useState } from "react";
import {
  BrainIcon,
  ClockIcon,
  DropletIcon,
  ShieldIcon,
  TrendingUpIcon,
  WifiIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { AreaDimension, AreaRecord } from "@/types/index";
import {
  mapAreaToIntelligenceProps,
  type AreaIntelligenceProps,
} from "@/lib/utils";
import { CommunityRatingForm } from "@/components/CommunityRatingForm";

type MappedData = AreaIntelligenceProps["data"];

interface AreaIntelligenceWithRecord {
  area: AreaRecord;
  /** Pass the authenticated user's id to show the rating form */
  userId?: string;
  data?: never;
}

interface AreaIntelligenceWithData {
  data: MappedData;
  userId?: string;
  area?: never;
}

type AreaIntelligenceComponentProps =
  | AreaIntelligenceWithRecord
  | AreaIntelligenceWithData;

interface DimensionCount {
  dimension: AreaDimension;
  avg: number;
  count: number;
}

/** Color thresholds use the 0–100 scale (DB scores * 10).
 *  green ≥ 70, amber ≥ 40, red < 40
 */
function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-rose-500";
}

function getProgressColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export function AreaIntelligence(props: AreaIntelligenceComponentProps) {
  // Resolve data: accept AreaRecord directly or pre-mapped data
  const data: MappedData = props.area
    ? mapAreaToIntelligenceProps(props.area).data
    : props.data;

  // Internet score: derive from area if available, else fall back to nightlife proxy
  const internetScore: number | undefined = props.area
    ? Math.round(props.area.internet_score * 10)
    : undefined;

  // Community rating counts per dimension (Requirement 5.6)
  const [dimensionCounts, setDimensionCounts] = useState<
    Map<AreaDimension, DimensionCount>
  >(new Map());
  const [ratingsKey, setRatingsKey] = useState(0); // bump to re-fetch after submission

  useEffect(() => {
    if (!props.area?.id) return;
    const areaId = props.area.id;

    fetch(`/api/community-ratings?area_id=${areaId}`)
      .then((r) => r.json())
      .then((json: { data?: DimensionCount[] }) => {
        const map = new Map<AreaDimension, DimensionCount>();
        for (const item of json.data ?? []) {
          map.set(item.dimension, item);
        }
        setDimensionCounts(map);
      })
      .catch(() => {
        /* non-critical — silently ignore */
      });
  }, [props.area?.id, ratingsKey]);

  function handleRatingsSubmitted() {
    setRatingsKey((k) => k + 1);
  }

  function countLabel(dim: AreaDimension): string {
    const entry = dimensionCounts.get(dim);
    if (!entry) return "";
    return `${entry.count} rating${entry.count === 1 ? "" : "s"}`;
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-5 sm:mb-6">
        <BrainIcon className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          Area Intelligence
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Commute Score */}
        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-6 h-6 text-accent" />
              <div>
                <div className="font-bold text-lg text-primary">
                  Commute Score
                </div>
                <div className="text-sm text-slate-500">{data.commuteTime}</div>
                {countLabel("commute") && (
                  <div className="text-xs text-slate-400">
                    {countLabel("commute")}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(data.commuteScore)}`}
            >
              {data.commuteScore}
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(data.commuteScore)}`}
              style={{ width: `${data.commuteScore}%` }}
            />
          </div>
        </motion.div>

        {/* Water Reliability */}
        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <DropletIcon className="w-6 h-6 text-accent" />
              <div>
                <div className="font-bold text-lg text-primary">
                  Water Reliability
                </div>
                <div className="text-sm text-slate-500">24/7 availability</div>
                {countLabel("water") && (
                  <div className="text-xs text-slate-400">
                    {countLabel("water")}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(data.waterReliability)}`}
            >
              {data.waterReliability}%
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(data.waterReliability)}`}
              style={{ width: `${data.waterReliability}%` }}
            />
          </div>
        </motion.div>

        {/* Security Level */}
        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ShieldIcon className="w-6 h-6 text-accent" />
              <div>
                <div className="font-bold text-lg text-primary">
                  Security Level
                </div>
                <div className="text-sm text-slate-500">
                  Crime rate &amp; safety
                </div>
                {countLabel("safety") && (
                  <div className="text-xs text-slate-400">
                    {countLabel("safety")}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(data.securityLevel)}`}
            >
              {data.securityLevel}
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(data.securityLevel)}`}
              style={{ width: `${data.securityLevel}%` }}
            />
          </div>
        </motion.div>

        {/* Internet Score — shown when AreaRecord is passed */}
        {internetScore !== undefined && (
          <motion.div
            className="bg-slate-50 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <WifiIcon className="w-6 h-6 text-accent" />
                <div>
                  <div className="font-bold text-lg text-primary">Internet</div>
                  <div className="text-sm text-slate-500">
                    Connectivity quality
                  </div>
                  {countLabel("internet") && (
                    <div className="text-xs text-slate-400">
                      {countLabel("internet")}
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`text-3xl font-bold ${getScoreColor(internetScore)}`}
              >
                {internetScore}
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(internetScore)}`}
                style={{ width: `${internetScore}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Lifestyle Score */}
        <motion.div
          className={`bg-slate-50 rounded-xl p-6 ${internetScore === undefined ? "" : "md:col-span-2"}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUpIcon className="w-6 h-6 text-accent" />
            <div className="font-bold text-lg text-primary">
              Lifestyle Score
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Nightlife</span>
                <span
                  className={`font-semibold ${getScoreColor(data.lifestyleScore.nightlife)}`}
                >
                  {data.lifestyleScore.nightlife}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(data.lifestyleScore.nightlife)}`}
                  style={{ width: `${data.lifestyleScore.nightlife}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Restaurants</span>
                <span
                  className={`font-semibold ${getScoreColor(data.lifestyleScore.restaurants)}`}
                >
                  {data.lifestyleScore.restaurants}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(data.lifestyleScore.restaurants)}`}
                  style={{ width: `${data.lifestyleScore.restaurants}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Parks &amp; Recreation</span>
                <span
                  className={`font-semibold ${getScoreColor(data.lifestyleScore.parks)}`}
                >
                  {data.lifestyleScore.parks}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(data.lifestyleScore.parks)}`}
                  style={{ width: `${data.lifestyleScore.parks}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Community rating form — shown only when an AreaRecord is passed and user is authenticated */}
      {props.area && props.userId && (
        <div className="mt-6">
          <CommunityRatingForm
            areaId={props.area.id}
            onSubmitted={handleRatingsSubmitted}
          />
        </div>
      )}
    </div>
  );
}
