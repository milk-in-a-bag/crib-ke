"use client";

import { useState, useEffect, useRef } from "react";
import type { ThreadMessage } from "@/types";
import { formatTimestamp } from "@/lib/format";

interface InboxThreadPanelProps {
  readonly inquiryId: string;
  readonly threadId: string | null;
  readonly seekerUserId: string | null;
  readonly userId: string;
}

export function InboxThreadPanel({
  inquiryId,
  threadId: initialThreadId,
  seekerUserId,
  userId,
}: InboxThreadPanelProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load existing messages when the panel mounts (if a thread exists)
  useEffect(() => {
    if (!seekerUserId) return;
    if (!threadId) return;

    let cancelled = false;

    async function loadThread() {
      try {
        const res = await fetch(`/api/messages/threads/${threadId}`);
        if (!res.ok) {
          if (!cancelled) setLoadError("Failed to load messages.");
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setMessages(json.data?.messages ?? []);
        }
      } catch {
        if (!cancelled) setLoadError("Failed to load messages.");
      }
    }

    loadThread();

    // Mark thread as read on open
    fetch(`/api/messages/threads/${threadId}/read`, { method: "PATCH" }).catch(
      () => {
        // non-critical — ignore errors
      },
    );

    return () => {
      cancelled = true;
    };
  }, [threadId, seekerUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Seeker is not a registered user — no reply possible
  if (!seekerUserId) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          This seeker is not a registered user — replies are unavailable.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = replyText.trim();
    if (!body || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    // Optimistic message
    const optimisticMsg: ThreadMessage = {
      id: `optimistic-${Date.now()}`,
      thread_id: threadId ?? "",
      sender_id: userId,
      body,
      read_by_seeker: false,
      read_by_owner: true,
      created_at: new Date().toISOString(),
      sender_name: "You",
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText("");

    try {
      let res: Response;

      if (threadId) {
        // Subsequent reply — append to existing thread
        res = await fetch(`/api/messages/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
      } else {
        // First reply — create thread + first message
        res = await fetch("/api/messages/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inquiry_id: inquiryId, body }),
        });
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const errMsg =
          (json as { error?: string }).error ?? "Failed to send reply.";
        setSubmitError(errMsg);
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setReplyText(body);
        return;
      }

      const json = await res.json();

      if (threadId) {
        // Replace the optimistic message with the real one from the server
        const realMsg = json.data as ThreadMessage;
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? realMsg : m)),
        );
      } else {
        // Thread was just created — capture the new thread id
        const newThreadId = (json.data as { id?: string })?.id ?? null;
        if (newThreadId) {
          setThreadId(newThreadId);
          // Replace optimistic message with the real one by reloading the thread
          const threadRes = await fetch(`/api/messages/threads/${newThreadId}`);
          if (threadRes.ok) {
            const threadJson = await threadRes.json();
            setMessages(threadJson.data?.messages ?? []);
          }
        }
      }
    } catch {
      setSubmitError("Failed to send reply. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setReplyText(body);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
      {loadError && <p className="text-sm text-red-500 mb-2">{loadError}</p>}

      {/* Message list */}
      {messages.length > 0 && (
        <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    isOwn
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="font-medium text-xs mb-0.5 opacity-75">
                    {isOwn ? "You" : (msg.sender_name ?? "Seeker")}
                  </p>
                  <p className="whitespace-pre-wrap wrap-break-word">
                    {msg.body}
                  </p>
                  <p
                    className={`text-xs mt-1 opacity-60 ${isOwn ? "text-right" : ""}`}
                  >
                    {formatTimestamp(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {messages.length === 0 && threadId && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
          No messages yet. Send the first reply below.
        </p>
      )}

      {/* Reply form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Write a reply…"
          rows={3}
          maxLength={2000}
          disabled={submitting}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
          >
            {submitting ? "Sending…" : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
