"use client";

import { useState } from "react";
import type { BookingStatus, BookingWithDetails } from "@/types";

interface BookingManagerProps {
  readonly initialBookings: BookingWithDetails[];
}

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookingManager({ initialBookings }: BookingManagerProps) {
  const [bookings, setBookings] =
    useState<BookingWithDetails[]>(initialBookings);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function performAction(
    bookingId: string,
    action: "confirm" | "cancel" | "reschedule",
    scheduledDate?: string,
  ) {
    setLoadingId(bookingId);
    setError(null);

    const body: Record<string, string> =
      action === "reschedule" && scheduledDate
        ? { action, scheduled_date: scheduledDate }
        : { action };

    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        if (action === "confirm") return { ...b, status: "confirmed" };
        if (action === "cancel") return { ...b, status: "cancelled" };
        if (action === "reschedule" && scheduledDate)
          return { ...b, scheduled_date: scheduledDate, status: "pending" };
        return b;
      }),
    );

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, ...json.data } : b)),
        );
        if (action === "reschedule") {
          setReschedulingId(null);
          setRescheduleDate("");
        }
      } else {
        const json = await res.json().catch(() => ({}));
        // Revert optimistic update on failure
        setBookings(initialBookings);
        setError(json.error ?? "Action failed. Please try again.");
      }
    } catch {
      setBookings(initialBookings);
      setError("Network error. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-16 text-center">
        <p className="text-gray-400 dark:text-gray-500">No bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                Seeker
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                Listing
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                Date
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                Status
              </th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const isLoading = loadingId === booking.id;
              const isRescheduling = reschedulingId === booking.id;

              return (
                <tr
                  key={booking.id}
                  className="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {booking.seeker_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {booking.seeker_email}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {booking.listing_title}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {formatDate(booking.scheduled_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status]}`}
                    >
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {booking.status === "cancelled" ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {booking.status === "pending" && (
                            <button
                              disabled={isLoading}
                              onClick={() =>
                                performAction(booking.id, "confirm")
                              }
                              className="px-3 py-1 text-xs font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isLoading ? "…" : "Confirm"}
                            </button>
                          )}
                          <button
                            disabled={isLoading}
                            onClick={() => performAction(booking.id, "cancel")}
                            className="px-3 py-1 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isLoading ? "…" : "Decline"}
                          </button>
                          <button
                            disabled={isLoading}
                            onClick={() => {
                              setReschedulingId(
                                isRescheduling ? null : booking.id,
                              );
                              setRescheduleDate(booking.scheduled_date);
                            }}
                            className="px-3 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Reschedule
                          </button>
                        </div>

                        {isRescheduling && (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="date"
                              min={today}
                              value={rescheduleDate}
                              onChange={(e) =>
                                setRescheduleDate(e.target.value)
                              }
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              disabled={isLoading || !rescheduleDate}
                              onClick={() =>
                                performAction(
                                  booking.id,
                                  "reschedule",
                                  rescheduleDate,
                                )
                              }
                              className="px-3 py-1 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isLoading ? "…" : "Save"}
                            </button>
                            <button
                              onClick={() => setReschedulingId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
