"use client";

import { useState } from "react";

interface Inquiry {
  id: string;
  property_id: string;
  name: string;
  phone: string;
  message: string;
  user_id: string | null;
  owner_id: string;
  read: boolean;
  created_at: string;
  listing_title: string | null;
}

interface OwnerInboxProps {
  readonly initialData: Inquiry[];
  readonly initialTotal: number;
  readonly initialPage: number;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function OwnerInbox({
  initialData,
  initialTotal,
  initialPage,
}: OwnerInboxProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function fetchPage(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox?page=${p}`);
      if (!res.ok) return;
      const json = await res.json();
      setInquiries(json.data);
      setTotal(json.total);
      setPage(json.page);
    } finally {
      setLoading(false);
    }
  }

  async function handleExpand(inquiry: Inquiry) {
    if (expandedId === inquiry.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(inquiry.id);

    if (inquiry.read) return;

    const res = await fetch(`/api/inbox/${inquiry.id}`, { method: "PATCH" });
    if (res.ok) {
      const json = await res.json();
      setInquiries((prev) =>
        prev.map((q) =>
          q.id === inquiry.id ? { ...q, read: json.data.read } : q,
        ),
      );
    }
  }

  if (inquiries.length === 0 && !loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <p className="text-gray-400 dark:text-gray-500 text-lg">
          No inquiries yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Inquiries from seekers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">Loading…</div>
      )}

      {inquiries.map((inquiry) => {
        const isExpanded = expandedId === inquiry.id;
        const isUnread = !inquiry.read;
        const borderClass = isUnread
          ? "border-blue-400 dark:border-blue-500"
          : "border-gray-200 dark:border-gray-700";
        const dotClass = isUnread ? "bg-blue-500" : "bg-transparent";
        const messageText = isExpanded
          ? inquiry.message
          : truncate(inquiry.message, 120);

        return (
          <button
            key={inquiry.id}
            type="button"
            className={`w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-colors ${borderClass}`}
            onClick={() => handleExpand(inquiry)}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="mt-1.5 shrink-0">
                <span
                  className={`block w-2.5 h-2.5 rounded-full ${dotClass}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {inquiry.name}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatRelativeTime(inquiry.created_at)}
                  </span>
                </div>

                {inquiry.listing_title && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                    {inquiry.listing_title}
                  </p>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {messageText}
                </p>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {inquiry.phone}
                    </p>
                    <p>
                      <span className="font-medium">Sent:</span>{" "}
                      {new Date(inquiry.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => {
              if (page > 1) fetchPage(page - 1);
            }}
            disabled={page <= 1 || loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              if (page < totalPages) fetchPage(page + 1);
            }}
            disabled={page >= totalPages || loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
