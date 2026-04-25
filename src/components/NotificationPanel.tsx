"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NotificationRecord } from "@/types";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

interface NotificationPanelProps {
  readonly initialUnreadCount: number;
}

export function NotificationPanel({
  initialUnreadCount,
}: NotificationPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
      setUnreadCount(json.unread_count ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  }

  async function handleNotificationClick(n: NotificationRecord) {
    // Optimistic mark-read
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      await fetch(`/api/notifications/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    }

    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="cursor-pointer p-2 text-slate-600 hover:text-accent transition-colors relative"
        aria-label="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-medium text-accent">
                    {unreadCount} unread
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-accent transition-colors disabled:opacity-50"
                >
                  <CheckCheckIcon className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  No notifications yet
                </div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50 ${
                          !n.read ? "bg-violet-50/60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && (
                            <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-accent" />
                          )}
                          <div
                            className={`flex-1 min-w-0 ${n.read ? "pl-4" : ""}`}
                          >
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {formatRelativeTime(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
