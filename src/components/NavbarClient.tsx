"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { HomeIcon, UserIcon, MenuIcon, XIcon } from "lucide-react";
import { NotificationPanel } from "@/components/NotificationPanel";
import { UserDropdown } from "@/components/navbar/UserDropdown";
import { MobileMenu } from "@/components/navbar/MobileMenu";
import { buildDashboardLinks } from "@/components/navbar/NavDashboardLinks";
import type { UserRole } from "@/types";

interface NavbarClientProps {
  readonly initialUnreadCount: number;
  readonly serverRole: UserRole | null;
  readonly unreadMessageCount?: number;
}

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "#", label: "Agents" },
];

export function NavbarClient({
  initialUnreadCount,
  serverRole,
  unreadMessageCount = 0,
}: NavbarClientProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !scrolled;
  const isAuthenticated = status === "authenticated";

  // Prefer client session role (always fresh), fall back to server-rendered role
  // @ts-expect-error role is a custom field on our user
  const role: UserRole | null = (session?.user?.role as UserRole) ?? serverRole;

  const dashboardLinks = buildDashboardLinks(
    isAuthenticated,
    role,
    unreadMessageCount,
  );

  // Transparent → white on scroll (home page only)
  useEffect(() => {
    if (!isHomePage) return;
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  function getLinkClass(href: string) {
    const active = pathname === href;
    if (active) {
      return isTransparent
        ? "text-sm font-semibold text-white"
        : "text-sm font-semibold text-accent";
    }
    return isTransparent
      ? "text-sm font-medium text-white/80 hover:text-white transition-colors"
      : "text-sm font-medium text-slate-600 hover:text-accent transition-colors";
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-1000 border-b transition-all duration-300 ${
        scrolled || !isHomePage
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo + nav links */}
          <div className="flex items-center space-x-8">
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center space-x-2"
            >
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={getLinkClass(link.href)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <div className="hidden sm:block">
                <NotificationPanel
                  initialUnreadCount={initialUnreadCount}
                  scrolled={!isTransparent}
                />
              </div>
            )}

            {(role === "owner" || role === "agent") && (
              <Link
                href="/dashboard/listings/new"
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors"
              >
                <span>Post Property</span>
              </Link>
            )}

            {isAuthenticated && session ? (
              <UserDropdown
                session={session}
                role={role}
                isTransparent={isTransparent}
                isOpen={userMenuOpen}
                onToggle={() => setUserMenuOpen((v) => !v)}
                onClose={() => setUserMenuOpen(false)}
                dashboardLinks={dashboardLinks}
              />
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
              onClick={() => setMobileMenuOpen((v) => !v)}
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

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={NAV_LINKS}
        isActive={(path) => pathname === path}
        session={session ?? null}
        isAuthenticated={isAuthenticated}
        role={role}
        dashboardLinks={dashboardLinks}
        initialUnreadCount={initialUnreadCount}
      />
    </nav>
  );
}
