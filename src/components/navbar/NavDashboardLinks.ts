import type { UserRole } from "@/types";

export interface DashboardLink {
  href: string;
  label: string;
  iconName:
    | "LayoutDashboard"
    | "Inbox"
    | "MessageSquare"
    | "Bookmark"
    | "ShieldCheck";
  badge?: number;
}

/**
 * Builds the ordered list of role-based dashboard links for the navbar.
 * Pure function — no JSX, no side effects, easy to unit-test.
 */
export function buildDashboardLinks(
  isAuthenticated: boolean,
  role: UserRole | null,
  unreadMessageCount: number,
): DashboardLink[] {
  if (!isAuthenticated) return [];

  // Dashboard — all authenticated roles (Requirement 11.5)
  const base: DashboardLink = {
    href: "/dashboard",
    label: "Dashboard",
    iconName: "LayoutDashboard",
  };

  if (role === "owner" || role === "agent") {
    return [
      base,
      { href: "/dashboard/inbox", label: "Inbox", iconName: "Inbox" },
      // Messages with unread badge (Requirement 11.2)
      {
        href: "/dashboard/inbox",
        label: "Messages",
        iconName: "MessageSquare",
        badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      },
    ];
  }

  if (role === "seeker") {
    return [
      base,
      {
        href: "/dashboard/saved-searches",
        label: "Saved Searches",
        iconName: "Bookmark",
      },
      // Messages link (Requirement 11.1)
      {
        href: "/dashboard/messages",
        label: "Messages",
        iconName: "MessageSquare",
      },
    ];
  }

  if (role === "admin") {
    return [
      base,
      {
        href: "/dashboard/admin/queue",
        label: "Admin Queue",
        iconName: "ShieldCheck",
      },
    ];
  }

  return [base];
}
