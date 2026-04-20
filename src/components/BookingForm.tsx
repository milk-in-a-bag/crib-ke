"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";

interface BookingFormProps {
  propertyId: string;
}

export function BookingForm({ propertyId }: BookingFormProps) {
  const { status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

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

      if (res.ok) {
        setSuccess(true);
        setDate("");
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to book. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
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
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-emerald-600 underline"
        >
          Schedule another visit
        </button>
      </div>
    );
  }

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
