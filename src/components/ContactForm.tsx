"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ContactFormProps {
  readonly propertyId: string;
}

export function ContactForm({ propertyId }: ContactFormProps) {
  const { data: session, status } = useSession();

  const [name, setName] = useState(session?.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, name, phone, message }),
      });

      if (res.ok) {
        setSuccess(true);
        setPhone("");
        setMessage("");
      } else {
        const json = await res.json().catch(() => ({}));
        if (res.status === 400 && json.details) {
          // Parse field-level errors from details string
          // details may be a JSON string of field errors or a plain message
          try {
            const parsed = JSON.parse(json.details);
            if (typeof parsed === "object" && parsed !== null) {
              setFieldErrors(parsed as Record<string, string>);
            } else {
              setError(json.error ?? "Validation error.");
            }
          } catch {
            setError(json.details ?? json.error ?? "Validation error.");
          }
        } else {
          setError(json.error ?? "Failed to send message. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
        <div className="text-emerald-600 font-semibold text-base mb-1">
          Message Sent!
        </div>
        <p className="text-emerald-700 text-sm">
          Your inquiry has been received. The property manager will get back to
          you shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-3 text-sm text-emerald-600 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  // Loading state — show a skeleton/disabled placeholder
  if (status === "loading") {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg" />
        <div className="h-10 bg-slate-200 rounded-lg" />
        <div className="h-20 bg-slate-200 rounded-lg" />
        <div className="h-11 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  // Unauthenticated — prompt to sign in
  if (status === "unauthenticated") {
    const callbackUrl = encodeURIComponent(`/property/${propertyId}`);
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 text-center">
        <p className="text-slate-700 text-sm font-medium mb-3">
          Sign in to contact the owner
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${callbackUrl}`}
          className="inline-block px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-hover transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // Authenticated — render the full form
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Your Name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter your name"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-accent transition-colors text-slate-800 text-sm"
        />
        {fieldErrors.name && (
          <p className="text-rose-600 text-xs mt-1">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-phone"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Phone Number
        </label>
        <input
          id="contact-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="+254 7XX XXX XXX"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-accent transition-colors text-slate-800 text-sm"
        />
        {fieldErrors.phone && (
          <p className="text-rose-600 text-xs mt-1">{fieldErrors.phone}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          placeholder="Hi, I'm interested in this property. Can you tell me more about..."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg resize-none outline-none focus:border-accent transition-colors text-slate-800 text-sm"
        />
        {fieldErrors.message && (
          <p className="text-rose-600 text-xs mt-1">{fieldErrors.message}</p>
        )}
      </div>

      {error && (
        <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 text-sm"
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
