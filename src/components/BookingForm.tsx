"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";

interface ExistingBooking {
  id: string;
  property_id: string;
  scheduled_date: string;
  status: string;
}

interface BookingFormProps {
  propertyId: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookingForm({ propertyId }: BookingFormProps) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingBooking, setExistingBooking] =
    useState<ExistingBooking | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  // Fetch existing active booking for this property on mount
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    setCheckingExisting(true);
    fetch(`/api/bookings?user_id=${session.user.id}`)
      .then((r) => r.json())
      .then((json: { data?: ExistingBooking[] }) => {
        const active = (json.data ?? []).find(
          (b) =>
            (b.status === "pending" || b.status === "confirmed") &&
            b.property_id === propertyId,
        );
        if (active) setExistingBooking(active);
      })
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setCheckingExisting(false));
  }, [status, session?.user?.id, propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (status !== "authenticated") {
      router.push(`/auth/signin?callbackUrl=/property/${propertyId}`);
      return;
    }

    if (!date || date < today) {
      setError("Please select today or a future date.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, scheduled_date: date }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        setDate("");
      } else if (res.status === 409 && json.existing_booking) {
        setExistingBooking(json.existing_booking);
      } else {
        setError(json.error ?? "Failed to book. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!existingBooking || !rescheduleDate) return;

    setRescheduling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${existingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          scheduled_date: rescheduleDate,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setExistingBooking(null);
        setRescheduleDate("");
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to reschedule. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRescheduling(false);
    }
  }

  async function handleCancel() {
    if (!existingBooking) return;
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${existingBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setExistingBooking(null);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to cancel.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="text-emerald-600 font-semibold text-lg mb-1">
          Visit Scheduled!
        </div>
        <p className="text-emerald-700 text-sm">
          Your visit request has been submitted. The property manager will
          confirm shortly.
        </p>
      </div>
    );
  }

  // Show existing booking UI
  if (existingBooking && !checkingExisting) {
    const isPending = existingBooking.status === "pending";
    const isConfirmed = existingBooking.status === "confirmed";
    const visitPassed = existingBooking.scheduled_date < today;

    return (
      <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-5">
          <CalendarIcon className="w-6 h-6 text-accent" />
          <h2 className="text-xl sm:text-2xl font-bold text-primary">
            Schedule a Visit
          </h2>
        </div>

        <div
          className={`rounded-xl p-4 mb-5 ${isConfirmed ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}
        >
          <p
            className={`text-sm font-medium mb-1 ${isConfirmed ? "text-emerald-800" : "text-amber-800"}`}
          >
            {isConfirmed ? "Visit confirmed" : "Visit pending approval"}
          </p>
          <p
            className={`text-sm ${isConfirmed ? "text-emerald-700" : "text-amber-700"}`}
          >
            {formatDate(existingBooking.scheduled_date)}
          </p>
        </div>

        {/* Pending: allow reschedule */}
        {isPending && !visitPassed && (
          <form onSubmit={handleReschedule} className="space-y-4">
            <div>
              <label
                htmlFor="reschedule_date"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Change Date
              </label>
              <input
                id="reschedule_date"
                type="date"
                min={today}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-accent transition-colors text-slate-800"
              />
            </div>

            {error && (
              <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={rescheduling}
                className="flex-1 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {rescheduling ? "Saving…" : "Change Date"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-rose-200 text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
              >
                Cancel Visit
              </button>
            </div>
          </form>
        )}

        {/* Confirmed: can only cancel (starts cycle again) */}
        {isConfirmed && !visitPassed && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Your visit is confirmed. To change the date, cancel and request a
              new visit.
            </p>
            {error && (
              <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
                {error}
              </p>
            )}
            <button
              onClick={handleCancel}
              className="w-full px-6 py-3 border border-rose-200 text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
            >
              Cancel Visit
            </button>
          </div>
        )}

        {visitPassed && (
          <p className="text-slate-500 text-sm text-center">
            This visit date has passed. Contact the property manager to book a
            new visit.
          </p>
        )}
      </div>
    );
  }

  // Default: no existing booking — show booking form
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
      <div className="flex items-center space-x-3 mb-5">
        <CalendarIcon className="w-6 h-6 text-accent" />
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          Schedule a Visit
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="scheduled_date"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Preferred Date
          </label>
          <input
            id="scheduled_date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-accent transition-colors text-slate-800"
          />
        </div>

        {error && (
          <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3.5 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {loading ? "Booking…" : "Request a Visit"}
        </button>

        {status !== "authenticated" && (
          <p className="text-xs text-slate-500 text-center">
            You&apos;ll be asked to sign in before confirming.
          </p>
        )}
      </form>
    </div>
  );
}
