"use client";
import React from "react";
import { motion } from "framer-motion";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { PropertyCard } from "../components/PropertyCard";
import { TrustBanner } from "../components/TrustBanner";
import { Footer } from "../components/Footer";
import { properties } from "../data/properties";
import type { PropertyListItem } from "@/types";
import { MapPinIcon, TrendingUpIcon } from "lucide-react";
export function Home() {
  const recommendedProperties: PropertyListItem[] = properties
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      title: p.name,
      price: p.price,
      price_type: p.priceType,
      type: "studio" as const,
      location: p.location,
      neighborhood: p.neighborhood,
      latitude: p.coordinates[0],
      longitude: p.coordinates[1],
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqft: p.sqft,
      images: p.images,
      availability_status: "available" as const,
      rating: p.rating,
      review_count: p.reviewCount,
    }));
  const neighborhoods = [
    {
      name: "Pacific Heights",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      avgPrice: "$1.2M",
      listings: 24,
    },
    {
      name: "Marina District",
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      avgPrice: "$3,200/mo",
      listings: 18,
    },
    {
      name: "Mission District",
      image:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      avgPrice: "$2,800/mo",
      listings: 32,
    },
    {
      name: "Hayes Valley",
      image:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      avgPrice: "$1.4M",
      listings: 15,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[520px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600"
          alt="Beautiful modern home"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/80" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            className="inline-block px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            🏡 Trusted by 10,000+ home seekers
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
          >
            Find Your <br className="hidden sm:block" />
            <span className="text-violet-300">Perfect Place</span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-slate-200 mb-10 max-w-2xl mx-auto"
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
            Discover your dream home with intelligent search, verified reviews,
            and real-world area insights
          </motion.p>

          <motion.div
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

      {/* Recommended Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Recommended for you
          </h2>
          <a
            href="#"
            className="text-accent font-semibold hover:text-accent-hover transition-colors text-sm md:text-base"
          >
            See all
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {recommendedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.08,
              }}
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
          {neighborhoods.map((neighborhood, index) => (
            <motion.div
              key={neighborhood.name}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
              whileHover={{
                y: -8,
              }}
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
              <div className="relative h-36 sm:h-48">
                <img
                  src={neighborhood.image}
                  alt={neighborhood.name}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                  <h3 className="text-white font-bold text-base sm:text-xl mb-0.5 sm:mb-1">
                    {neighborhood.name}
                  </h3>
                  <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                    <span className="flex items-center space-x-1">
                      <TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{neighborhood.avgPrice}</span>
                    </span>
                    <span>{neighborhood.listings} listings</span>
                  </div>
                </div>
              </div>
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
