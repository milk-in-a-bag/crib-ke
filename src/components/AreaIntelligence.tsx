"use client";
import React from "react";
import {
  BrainIcon,
  ClockIcon,
  DropletIcon,
  ShieldIcon,
  TrendingUpIcon,
} from "lucide-react";
import { motion } from "framer-motion";
interface AreaIntelligenceProps {
  data: {
    commuteScore: number;
    commuteTime: string;
    waterReliability: number;
    securityLevel: number;
    lifestyleScore: {
      nightlife: number;
      restaurants: number;
      parks: number;
    };
  };
}
export function AreaIntelligence({ data }: AreaIntelligenceProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-rose-500";
  };
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-5 sm:mb-6">
        <BrainIcon className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          Area Intelligence
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.1,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-6 h-6 text-accent" />
              <div>
                <div className="font-bold text-lg text-primary">
                  Commute Score
                </div>
                <div className="text-sm text-slate-500">{data.commuteTime}</div>
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
              style={{
                width: `${data.commuteScore}%`,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.2,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <DropletIcon className="w-6 h-6 text-accent" />
              <div>
                <div className="font-bold text-lg text-primary">
                  Water Reliability
                </div>
                <div className="text-sm text-slate-500">24/7 availability</div>
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
              style={{
                width: `${data.waterReliability}%`,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.3,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ShieldIcon className="w-6 h-6 text-accent" />
              <div>
                <div className="font-bold text-lg text-primary">
                  Security Level
                </div>
                <div className="text-sm text-slate-500">
                  Crime rate & safety
                </div>
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
              style={{
                width: `${data.securityLevel}%`,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-50 rounded-xl p-6"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.4,
          }}
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
                <span className="font-semibold">
                  {data.lifestyleScore.nightlife}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(data.lifestyleScore.nightlife)}`}
                  style={{
                    width: `${data.lifestyleScore.nightlife}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Restaurants</span>
                <span className="font-semibold">
                  {data.lifestyleScore.restaurants}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(data.lifestyleScore.restaurants)}`}
                  style={{
                    width: `${data.lifestyleScore.restaurants}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600">Parks & Recreation</span>
                <span className="font-semibold">
                  {data.lifestyleScore.parks}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressColor(data.lifestyleScore.parks)}`}
                  style={{
                    width: `${data.lifestyleScore.parks}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
