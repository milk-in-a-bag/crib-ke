"use client";
import React from "react";
import { BadgeCheckIcon, StarIcon, HomeIcon, BrainIcon } from "lucide-react";
import { motion } from "framer-motion";
export function TrustBanner() {
  const stats = [
    {
      icon: BadgeCheckIcon,
      value: "2,500+",
      label: "Verified Reviews",
    },
    {
      icon: StarIcon,
      value: "98%",
      label: "Satisfaction Rate",
    },
    {
      icon: HomeIcon,
      value: "500+",
      label: "Verified Listings",
    },
    {
      icon: BrainIcon,
      value: "AI-Powered",
      label: "Smart Insights",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-accent to-violet-700 rounded-2xl p-8 md:p-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Find Your Home with Confidence
        </h2>
        <p className="text-violet-100 text-lg">
          Trusted by thousands of renters and buyers across San Francisco
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ icon: Icon, value, label }, index) => (
          <motion.div
            key={label}
            className="text-center"
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: index * 0.1,
            }}
            viewport={{
              once: true,
            }}
          >
            <Icon className="w-10 h-10 mx-auto mb-3 text-violet-200" />
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-violet-200 text-sm">{label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
