"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
const categories = [
  "All",
  "House",
  "Apartment",
  "Villa",
  "Townhouse",
  "Studio",
];
export function CategoryFilter() {
  const [selected, setSelected] = useState("All");
  return (
    <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <motion.button
          key={category}
          onClick={() => setSelected(category)}
          className={`px-6 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all ${selected === category ? "bg-accent text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100"}`}
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
}
