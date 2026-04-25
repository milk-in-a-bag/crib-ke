"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { PropertyCard } from "../components/PropertyCard";
import { TrustBanner } from "../components/TrustBanner";
import { Footer } from "../components/Footer";
import type { PropertyListItem, AreaRecord } from "@/types";
import { MapPinIcon, TrendingUpIcon } from "lucide-react";

interface HomeProps {
  featuredProperties: PropertyListItem[];
  areas: AreaRecord[];
}

export function Home({ featuredProperties, areas }: HomeProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600"
          alt="Beautiful modern home"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            Find Your <br className="hidden sm:block" />
            <span className="text-violet-300">Perfect Place</span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Discover your dream home with intelligent search, verified reviews,
            and real-world area insights
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <SearchBar variant="hero" />
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <CategoryFilter />
      </section>

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Recommended for you
          </h2>
          <Link
            href="/explore"
            className="text-accent font-semibold hover:text-accent-hover transition-colors text-sm md:text-base"
          >
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {featuredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <PropertyCard property={property} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popular Neighborhoods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center space-x-3 mb-6 md:mb-8">
          <MapPinIcon className="w-7 h-7 md:w-8 md:h-8 text-accent" />
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Popular Neighborhoods
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {areas.map((area, index) => (
            <motion.div
              key={area.id}
              whileHover={{ y: -8 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/explore?q=${encodeURIComponent(area.name)}`}
                className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="relative h-36 sm:h-48 bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                    <h3 className="text-white font-bold text-base sm:text-xl mb-0.5 sm:mb-1">
                      {area.name}
                    </h3>
                    <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                      <span className="flex items-center space-x-1">
                        <TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Safety {area.safety_score}/10</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <TrustBanner />
      </section>

      <Footer />
    </div>
  );
}
