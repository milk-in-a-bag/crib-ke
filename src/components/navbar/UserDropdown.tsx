"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { UserIcon, LogOutIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavIcon } from "./NavIcon";
import type { DashboardLink } from "./NavDashboardLinks";
import type { Session } from "next-auth";
import type { UserRole } from "@/types";

interface UserDropdownProps {
  session: Session;
  role: UserRole | null;
  isTransparent: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  dashboardLinks: DashboardLink[];
}

/** Initials from a full name, up to 2 characters. */
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export function UserDropdown({
  session,
  role,
  isTransparent,
  isOpen,
  onToggle,
  onClose,
  dashboardLinks,
}: UserDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative hidden sm:block" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={onToggle}
        className="cursor-pointer flex items-center space-x-2 focus:outline-none"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-accent/20"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isTransparent ? "bg-white/20" : "bg-accent/10"
            }`}
          >
            <span
              className={`text-sm font-semibold ${
                isTransparent ? "text-white" : "text-accent"
              }`}
            >
              {getInitials(session.user?.name)}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50"
            role="menu"
          >
            {/* User info header */}
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {session.user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session.user?.email}
              </p>
            </div>

            {/* Profile */}
            <Link
              href="/dashboard/profile"
              onClick={onClose}
              role="menuitem"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              My Profile
            </Link>

            {/* My Listings — owners and agents only */}
            {(role === "owner" || role === "agent") && (
              <Link
                href="/dashboard/listings"
                onClick={onClose}
                role="menuitem"
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                My Listings
              </Link>
            )}

            {/* Role-based links */}
            {dashboardLinks.map((dl) => (
              <Link
                key={dl.href + dl.label}
                href={dl.href}
                onClick={onClose}
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <NavIcon name={dl.iconName} />
                <span className="flex-1">{dl.label}</span>
                {dl.badge !== undefined && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold leading-none">
                    {dl.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Sign out */}
            <button
              onClick={() => {
                onClose();
                signOut({ callbackUrl: "/" });
              }}
              role="menuitem"
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
