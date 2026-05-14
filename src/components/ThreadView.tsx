"use client";

import { useState } from "react";
import { MessageSquareIcon } from "lucide-react";
import type { MessageThread } from "@/types";
import { ThreadList } from "@/components/ThreadList";
import { ThreadPanel } from "@/components/ThreadPanel";

interface ThreadViewProps {
  readonly threads: MessageThread[];
  readonly currentUserId: string;
}

export function ThreadView({ threads, currentUserId }: ThreadViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [localUnread, setLocalUnread] = useState<Record<string, number>>(() =>
    Object.fromEntries(threads.map((t) => [t.id, t.unread_count ?? 0])),
  );

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  function handleSelect(threadId: string) {
    setSelectedThreadId(threadId);
  }

  function handleMarkRead(threadId: string) {
    setLocalUnread((prev) => ({ ...prev, [threadId]: 0 }));
  }

  if (threads.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <MessageSquareIcon className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">
          No conversations yet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Contact a property owner to start a thread.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        localUnread={localUnread}
        onSelect={handleSelect}
      />
      <ThreadPanel
        thread={selectedThread}
        currentUserId={currentUserId}
        onBack={() => setSelectedThreadId(null)}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
}
