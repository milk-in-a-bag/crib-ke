"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  SearchIcon,
  BellIcon,
  UserIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path: string) => pathname === path;
  const navLinks = [
    {
      href: "/",
      label: "Find Home",
    },
    {
      href: "/explore",
      label: "Explore",
    },
    {
      href: "#",
      label: "Sell Property",
    },
    {
      href: "#",
      label: "Agents",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <HomeIcon className="w-7 h-7 text-accent" />
              <span className="text-xl font-bold text-primary">CribKE</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${isActive(link.href) ? "text-accent" : "text-slate-600 hover:text-accent"}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="hidden sm:block p-2 text-slate-600 hover:text-accent transition-colors">
              <SearchIcon className="w-5 h-5" />
            </button>
            <button className="hidden sm:block p-2 text-slate-600 hover:text-accent transition-colors relative">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            </button>
            <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors">
              <span>Post Property</span>
            </button>
            <button className="hidden sm:flex w-9 h-9 rounded-full bg-slate-200 items-center justify-center hover:bg-slate-300 transition-colors">
              <UserIcon className="w-5 h-5 text-slate-600" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-accent transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="md:hidden overflow-hidden bg-white border-t border-slate-100"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive(link.href) ? "bg-violet-50 text-accent" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-slate-100 mt-3">
                <button className="w-full px-4 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors">
                  Post Property
                </button>
              </div>
              <div className="flex items-center space-x-4 px-4 pt-2">
                <button className="p-2 text-slate-600 hover:text-accent transition-colors relative">
                  <BellIcon className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
                </button>
                <button className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
