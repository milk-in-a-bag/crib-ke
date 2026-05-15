import type { UserRole } from "@/types";

export interface DashboardLink {
  href: string;
  label: string;
  iconName:
    | "LayoutDashboard"
    | "Inbox"
    | "MessageSquare"
    | "Bookmark"
    | "ShieldCheck"
    | "Building2";
  badge?: number;
}

/**
 * Builds the ordered list of role-based dashboard links for the navbar.
 * Pure function — no JSX, no side effects, easy to unit-test.
 *
 * Note: unreadMessageCount is intentionally unused here — unread counts
 * are surfaced via the notification bell, not duplicated on nav links.
 */
export function buildDashboardLinks(
  isAuthenticated: boolean,
  role: UserRole | null,
  _unreadMessageCount: number,
): DashboardLink[] {
  if (!isAuthenticated) return [];

  if (role === "owner" || role === "agent") {
    return [
      {
        href: "/dashboard/listings",
        label: "My Listings",
        iconName: "Building2",
      },
      {
        href: "/dashboard/inbox",
        label: "Inbox",
        iconName: "Inbox",
      },
    ];
  }

  if (role === "seeker") {
    return [
      {
        href: "/dashboard/saved-searches",
        label: "Saved Searches",
        iconName: "Bookmark",
      },
      {
        href: "/dashboard/messages",
        label: "Messages",
        iconName: "MessageSquare",
      },
    ];
  }

  if (role === "admin") {
    return [
      {
        href: "/dashboard",
        label: "Dashboard",
        iconName: "LayoutDashboard",
      },
      {
        href: "/dashboard/admin/queue",
        label: "Admin Queue",
        iconName: "ShieldCheck",
      },
    ];
  }

  return [];
}
