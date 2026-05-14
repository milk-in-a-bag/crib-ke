"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquareIcon } from "lucide-react";
import type { MessageThread, ThreadMessage } from "@/types";
import { formatTimestamp } from "@/lib/format";

interface ThreadPanelProps {
  readonly thread: MessageThread | null;
  readonly currentUserId: string;
  readonly onBack: () => void;
  readonly onMarkRead: (threadId: string) => void;
}

export function ThreadPanel({
  thread,
  currentUserId,
  onBack,
  onMarkRead,
}: ThreadPanelProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load messages whenever the selected thread changes
  useEffect(() => {
    if (!thread) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setMessages([]);
    setReplyText("");
    setSubmitError(null);

    fetch(`/api/messages/threads/${thread.id}`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .then((json) => {
        if (!cancelled) setMessages(json.data?.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Failed to load messages.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Mark as read and notify parent to clear the badge
    fetch(`/api/messages/threads/${thread.id}/read`, { method: "PATCH" })
      .then(() => onMarkRead(thread.id))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [thread?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = replyText.trim();
    if (!body || submitting || !thread) return;

    setSubmitting(true);
    setSubmitError(null);

    const optimistic: ThreadMessage = {
      id: `optimistic-${Date.now()}`,
      thread_id: thread.id,
      sender_id: currentUserId,
      body,
      read_by_seeker: true,
      read_by_owner: false,
      created_at: new Date().toISOString(),
      sender_name: "You",
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyText("");

    try {
      const res = await fetch(`/api/messages/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setSubmitError((json as { error?: string }).error ?? "Failed to send.");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setReplyText(body);
        return;
      }

      const json = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? (json.data as ThreadMessage) : m,
        ),
      );
    } catch {
      setSubmitError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReplyText(body);
    } finally {
      setSubmitting(false);
    }
  }

  // No thread selected — desktop placeholder
  if (!thread) {
    return (
      <div className="hidden sm:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <MessageSquareIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Select a conversation to read messages
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="sm:hidden p-1 -ml-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Back to thread list"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {thread.listing_title ?? "Property"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {thread.owner_name ?? "Owner"}
          </p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            Loading messages…
          </p>
        )}
        {loadError && (
          <p className="text-sm text-red-500 text-center py-8">{loadError}</p>
        )}
        {!loading && !loadError && messages.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            No messages yet. Send the first reply below.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isOwn
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {isOwn ? "You" : (msg.sender_name ?? "Owner")}
                </p>
                <p className="whitespace-pre-wrap wrap-break-word">
                  {msg.body}
                </p>
                <p
                  className={`text-xs mt-1.5 ${isOwn ? "text-blue-200 text-right" : "text-gray-400 dark:text-gray-500"}`}
                >
                  {formatTimestamp(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply form */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {submitError && (
          <p className="text-xs text-red-500 mb-2">{submitError}</p>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Write a reply…"
            rows={2}
            maxLength={2000}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors self-end"
          >
            {submitting ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
