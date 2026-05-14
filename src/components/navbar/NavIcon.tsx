"use client";

import {
  LayoutDashboardIcon,
  InboxIcon,
  MessageSquareIcon,
  BookmarkIcon,
  ShieldCheckIcon,
  Building2Icon,
} from "lucide-react";
import type { DashboardLink } from "./NavDashboardLinks";

const iconMap = {
  LayoutDashboard: LayoutDashboardIcon,
  Inbox: InboxIcon,
  MessageSquare: MessageSquareIcon,
  Bookmark: BookmarkIcon,
  ShieldCheck: ShieldCheckIcon,
  Building2: Building2Icon,
} as const;

interface NavIconProps {
  name: DashboardLink["iconName"];
  className?: string;
}

export function NavIcon({ name, className = "w-4 h-4" }: NavIconProps) {
  const Icon = iconMap[name];
  return <Icon className={className} />;
}
