"use client";

import type { MessageThread } from "@/types";
import { formatRelative, truncate } from "@/lib/format";

interface ThreadListProps {
  readonly threads: MessageThread[];
  readonly selectedThreadId: string | null;
  readonly localUnread: Record<string, number>;
  readonly onSelect: (threadId: string) => void;
  readonly perspective?: "seeker" | "owner";
}

export function ThreadList({
  threads,
  selectedThreadId,
  localUnread,
  onSelect,
  perspective = "seeker",
}: ThreadListProps) {
  return (
    <aside
      className={`w-full sm:w-80 lg:w-96 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto ${
        selectedThreadId ? "hidden sm:flex sm:flex-col" : "flex flex-col"
      }`}
    >
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {perspective === "owner" ? "Inbox" : "Messages"}
        </h1>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {threads.map((thread) => {
          const preview = truncate(thread.inquiry_message ?? "", 80);
          const unread = localUnread[thread.id] ?? 0;
          const isSelected = thread.id === selectedThreadId;
          const otherParty =
            perspective === "owner"
              ? (thread.seeker_name ?? "Seeker")
              : (thread.owner_name ?? "Owner");

          return (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => onSelect(thread.id)}
                className={`w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {thread.listing_title ?? "Property"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {otherParty}
                    </p>
                    {preview && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {preview}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatRelative(thread.updated_at)}
                    </span>
                    {unread > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
