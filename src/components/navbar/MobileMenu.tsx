"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { UserIcon, LogOutIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPanel } from "@/components/NotificationPanel";
import { NavIcon } from "./NavIcon";
import type { DashboardLink } from "./NavDashboardLinks";
import type { Session } from "next-auth";
import type { UserRole } from "@/types";

interface NavLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly navLinks: NavLink[];
  readonly isActive: (path: string) => boolean;
  readonly session: Session | null;
  readonly isAuthenticated: boolean;
  readonly role: UserRole | null;
  readonly dashboardLinks: DashboardLink[];
  readonly initialUnreadCount: number;
}

export function MobileMenu({
  isOpen,
  onClose,
  navLinks,
  isActive,
  session,
  isAuthenticated,
  role,
  dashboardLinks,
  initialUnreadCount,
}: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="md:hidden overflow-hidden bg-white border-t border-slate-100"
        >
          <div className="px-4 py-4 space-y-1">
            {/* Public nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-violet-50 text-accent"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Post Property — owners and agents */}
            {(role === "owner" || role === "agent") && (
              <div className="pt-3 border-t border-slate-100 mt-3">
                <Link
                  href="/dashboard/listings/new"
                  onClick={onClose}
                  className="block w-full text-center px-4 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors"
                >
                  Post Property
                </Link>
              </div>
            )}

            {/* User identity row */}
            <div className="flex items-center justify-between px-4 pt-2">
              {isAuthenticated && (
                <NotificationPanel initialUnreadCount={initialUnreadCount} />
              )}

              {isAuthenticated && session ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-accent">
                          {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={onClose}
                  className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-accent"
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Sign in</span>
                </Link>
              )}
            </div>

            {/* Role-based links */}
            {isAuthenticated && dashboardLinks.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                {dashboardLinks.map((dl) => (
                  <Link
                    key={dl.href + dl.label}
                    href={dl.href}
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
