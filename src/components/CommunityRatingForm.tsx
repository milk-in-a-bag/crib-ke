"use client";
import React, { useState } from "react";
import type { AreaDimension } from "@/types";

const DIMENSIONS: { key: AreaDimension; label: string; description: string }[] =
  [
    {
      key: "safety",
      label: "Safety",
      description: "Crime rate & personal security",
    },
    {
      key: "water",
      label: "Water",
      description: "Reliability of water supply",
    },
    { key: "commute", label: "Commute", description: "Ease of getting around" },
    { key: "internet", label: "Internet", description: "Connectivity quality" },
    {
      key: "flooding",
      label: "Flooding",
      description: "Risk of flooding (1 = high risk, 10 = no risk)",
    },
  ];

interface Props {
  readonly areaId: string;
  /** Called after a successful submission so the parent can refresh scores */
  readonly onSubmitted?: () => void;
}

type DimensionValues = Record<AreaDimension, number>;
type DimensionErrors = Partial<Record<AreaDimension, string>>;

const DEFAULT_VALUES: DimensionValues = {
  safety: 5,
  water: 5,
  commute: 5,
  internet: 5,
  flooding: 5,
};

export function CommunityRatingForm({ areaId, onSubmitted }: Props) {
  const [values, setValues] = useState<DimensionValues>({ ...DEFAULT_VALUES });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<DimensionErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSliderChange(dim: AreaDimension, raw: string) {
    setValues((prev) => ({ ...prev, [dim]: Number(raw) }));
    setErrors((prev) => ({ ...prev, [dim]: undefined }));
    setGlobalError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);
    setSuccessMessage(null);

    const newErrors: DimensionErrors = {};
    let hasError = false;

    // Submit each dimension sequentially; collect per-dimension errors
    for (const { key } of DIMENSIONS) {
      try {
        const res = await fetch("/api/community-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            area_id: areaId,
            dimension: key,
            value: values[key],
          }),
        });

        if (!res.ok) {
          const json = (await res.json()) as {
            error?: string;
            message?: string;
            retry_after?: string;
          };

          if (res.status === 429) {
            const retryDate = json.retry_after
              ? new Date(json.retry_after).toLocaleDateString("en-KE", {
                  dateStyle: "long",
                })
              : "30 days from your last submission";
            newErrors[key] = `You can rate this again after ${retryDate}`;
          } else {
            newErrors[key] = json.message ?? json.error ?? "Submission failed";
          }
          hasError = true;
        }
      } catch {
        newErrors[key] = "Network error — please try again";
        hasError = true;
      }
    }

    setErrors(newErrors);
    setSubmitting(false);

    if (!hasError) {
      setSuccessMessage("Thanks! Your ratings have been submitted.");
      setValues({ ...DEFAULT_VALUES });
      onSubmitted?.();
    } else if (Object.keys(newErrors).length < DIMENSIONS.length) {
      // Some succeeded, some failed
      setGlobalError(
        "Some ratings were submitted. See individual errors below.",
      );
      onSubmitted?.();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 rounded-xl p-5 space-y-5"
      aria-label="Rate this area"
    >
      <h3 className="font-bold text-lg text-primary">Rate this area</h3>

      {globalError && (
        <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          {globalError}
        </p>
      )}

      {successMessage && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          {successMessage}
        </p>
      )}

      {DIMENSIONS.map(({ key, label, description }) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-primary">
                {label}
              </span>
              <span className="ml-2 text-xs text-slate-500">{description}</span>
            </div>
            <span className="text-sm font-bold text-accent w-6 text-right">
              {values[key]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={values[key]}
            onChange={(e) => handleSliderChange(key, e.target.value)}
            className="w-full accent-accent"
            aria-label={`${label} rating`}
            disabled={submitting}
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 (poor)</span>
            <span>10 (excellent)</span>
          </div>
          {errors[key] && (
            <p className="text-xs text-rose-600 mt-1">{errors[key]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting…" : "Submit ratings"}
      </button>
    </form>
  );
}
