"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  HomeIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  InboxIcon,
  BookmarkIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPanel } from "@/components/NotificationPanel";
import type { UserRole } from "@/types";

interface NavbarClientProps {
  readonly initialUnreadCount: number;
  readonly serverRole: UserRole | null;
}

export function NavbarClient({
  initialUnreadCount,
  serverRole,
}: NavbarClientProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !scrolled;

  // Transparent → white on scroll (only on home page)
  useEffect(() => {
    if (!isHomePage) return;
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);
  const isAuthenticated = status === "authenticated";

  // Prefer client session role (always fresh), fall back to server-rendered role
  // @ts-expect-error role is a custom field on our user
  const role: UserRole | null = (session?.user?.role as UserRole) ?? serverRole;

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "#", label: "Agents" },
  ];

  // Role-based dashboard links shown in the user dropdown
  const dashboardLinks: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[] = [];
  if (role === "owner" || role === "agent") {
    dashboardLinks.push({
      href: "/dashboard/inbox",
      label: "Inbox",
      icon: <InboxIcon className="w-4 h-4" />,
    });
  }
  if (role === "seeker") {
    dashboardLinks.push({
      href: "/dashboard/saved-searches",
      label: "Saved Searches",
      icon: <BookmarkIcon className="w-4 h-4" />,
    });
  }
  if (role === "admin") {
    dashboardLinks.push({
      href: "/dashboard/admin/queue",
      label: "Admin Queue",
      icon: <ShieldCheckIcon className="w-4 h-4" />,
    });
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] border-b transition-all duration-300 ${
        scrolled || !isHomePage
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo + nav links */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <HomeIcon
                className={`w-7 h-7 ${isTransparent ? "text-white" : "text-accent"}`}
              />
              <span
                className={`text-xl font-bold ${isTransparent ? "text-white" : "text-primary"}`}
              >
                CribKE
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? isTransparent
                        ? "text-white font-semibold"
                        : "text-accent"
                      : isTransparent
                        ? "text-white/80 hover:text-white"
                        : "text-slate-600 hover:text-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center space-x-3">
            {/* Notification bell — only for authenticated users */}
            {isAuthenticated && (
              <div className="hidden sm:block">
                <NotificationPanel
                  initialUnreadCount={initialUnreadCount}
                  scrolled={!isTransparent}
                />
              </div>
            )}

            {/* Post Property button — owners and agents only */}
            {(role === "owner" || role === "agent") && (
              <Link
                href="/dashboard/listings/new"
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors"
              >
                <span>Post Property</span>
              </Link>
            )}

            {/* User menu — desktop */}
            {isAuthenticated ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="cursor-pointer flex items-center space-x-2 focus:outline-none"
                  aria-label="User menu"
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
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${isTransparent ? "bg-white/20" : "bg-accent/10"}`}
                    >
                      <span
                        className={`text-sm font-semibold ${isTransparent ? "text-white" : "text-accent"}`}
                      >
                        {session.user?.name
                          ?.split(" ")
                          .filter(Boolean)
                          .map((n) => n[0].toUpperCase())
                          .slice(0, 2)
                          .join("") ?? "U"}
                      </span>
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {session.user?.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>

                      {(role === "owner" || role === "agent") && (
                        <Link
                          href="/dashboard/listings"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          My Listings
                        </Link>
                      )}

                      {dashboardLinks.map((dl) => (
                        <Link
                          key={dl.href}
                          href={dl.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {dl.icon}
                          {dl.label}
                        </Link>
                      ))}

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOutIcon className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="hidden sm:flex w-9 h-9 rounded-full bg-slate-200 items-center justify-center hover:bg-slate-300 transition-colors"
                aria-label="Sign in"
              >
                <UserIcon className="w-5 h-5 text-slate-600" />
              </Link>
            )}

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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-white border-t border-slate-100"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-violet-50 text-accent"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {(role === "owner" || role === "agent") && (
                <div className="pt-3 border-t border-slate-100 mt-3">
                  <Link
                    href="/dashboard/listings/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Post Property
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between px-4 pt-2">
                {isAuthenticated && (
                  <NotificationPanel initialUnreadCount={initialUnreadCount} />
                )}

                {isAuthenticated ? (
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
                        setMobileMenuOpen(false);
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
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-accent"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Sign in</span>
                  </Link>
                )}
              </div>

              {/* Mobile role-based links */}
              {isAuthenticated && dashboardLinks.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {dashboardLinks.map((dl) => (
                    <Link
                      key={dl.href}
                      href={dl.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {dl.icon}
                      {dl.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
