"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import type {
  PropertyDetail,
  PropertyType,
  PriceType,
  AvailabilityStatus,
} from "@/types";

// ── Zod-style inline validation (no zod import needed for client form) ──────

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "bedsitter", label: "Bedsitter" },
  { value: "one_bedroom", label: "1 Bedroom" },
  { value: "two_bedroom", label: "2 Bedroom" },
  { value: "three_bedroom", label: "3 Bedroom" },
  { value: "studio", label: "Studio" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
];

const AMENITY_OPTIONS: string[] = [
  "wifi",
  "parking",
  "security",
  "water",
  "electricity",
  "gym",
  "pool",
  "balcony",
  "garden",
  "elevator",
  "cctv",
  "generator",
  "borehole",
  "solar",
  "dsq",
];

interface FormValues {
  title: string;
  description: string;
  price: number;
  price_type: PriceType;
  type: PropertyType;
  location: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  amenities: string[];
  availability_status: AvailabilityStatus;
}

interface ListingFormProps {
  initialData?: PropertyDetail;
}

const STEPS = [
  "Basic Info",
  "Location",
  "Details & Amenities",
  "Images",
] as const;

export function ListingForm({ initialData }: ListingFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>(() =>
    (initialData?.images ?? []).map((url) => ({
      url,
      public_id: url,
      preview: url,
      name: url.split("/").pop() ?? "image",
    })),
  );
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? 0,
      price_type: initialData?.price_type ?? "rent",
      type: initialData?.type ?? "bedsitter",
      location: initialData?.location ?? "",
      neighborhood: initialData?.neighborhood ?? "",
      latitude: initialData?.latitude ?? -1.286389,
      longitude: initialData?.longitude ?? 36.817223,
      bedrooms: initialData?.bedrooms ?? 0,
      bathrooms: initialData?.bathrooms ?? 0,
      sqft: initialData?.sqft ?? 0,
      amenities: initialData?.amenities ?? [],
      availability_status: initialData?.availability_status ?? "available",
    },
  });

  const watchedAmenities = watch("amenities");

  const toggleAmenity = (amenity: string) => {
    const current = watchedAmenities ?? [];
    if (current.includes(amenity)) {
      setValue(
        "amenities",
        current.filter((a) => a !== amenity),
      );
    } else {
      setValue("amenities", [...current, amenity]);
    }
  };

  // Step validation field groups
  const stepFields: (keyof FormValues)[][] = [
    ["title", "description", "price", "price_type", "type"],
    ["location", "neighborhood", "latitude", "longitude"],
    ["bedrooms", "bathrooms", "sqft", "amenities", "availability_status"],
    [],
  ];

  const goNext = async () => {
    const valid = await trigger(stepFields[step] as (keyof FormValues)[]);
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        sqft: Number(data.sqft) || undefined,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        images: images.map((i) => i.url),
      };

      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/properties/${initialData!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.details ?? body?.error ?? "Failed to save listing",
        );
      }

      const { data: property } = await res.json();
      router.push(`/dashboard/listings/${property.id}/edit`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!initialData?.id) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${initialData.id}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.details ?? body?.error ?? "Failed to submit for review",
        );
      }
      setSubmitSuccess(
        "Your listing has been submitted for review. You will be notified once it is approved.",
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (
      !confirm(
        "Are you sure you want to delete this listing? This cannot be undone.",
      )
    )
      return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/properties/${initialData.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to delete listing");
      }
      router.push("/dashboard/listings");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Delete failed");
      setIsDeleting(false);
    }
  };

  const canDelete =
    isEdit &&
    (initialData?.listing_status === "draft" ||
      initialData?.listing_status === "rejected");

  const canSubmitForReview =
    isEdit &&
    (initialData?.listing_status === "draft" ||
      initialData?.listing_status === "rejected");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step
                  ? "bg-green-500 text-white"
                  : i === step
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                i === step
                  ? "font-semibold text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px bg-gray-200 dark:bg-gray-700 mx-1" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Info
            </h2>

            <Field label="Title" error={errors.title?.message}>
              <input
                {...register("title", { required: "Title is required" })}
                className={inputCls(!!errors.title)}
                placeholder="e.g. Spacious 2-bedroom in Kilimani"
              />
            </Field>

            <Field label="Description" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={4}
                className={inputCls(false)}
                placeholder="Describe the property..."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (KES)" error={errors.price?.message}>
                <input
                  type="number"
                  {...register("price", {
                    required: "Price is required",
                    min: {
                      value: 1,
                      message: "Price must be a positive number",
                    },
                    valueAsNumber: true,
                  })}
                  className={inputCls(!!errors.price)}
                  placeholder="e.g. 25000"
                />
              </Field>

              <Field label="Price Type" error={errors.price_type?.message}>
                <select
                  {...register("price_type", { required: true })}
                  className={inputCls(!!errors.price_type)}
                >
                  <option value="rent">Per Month (Rent)</option>
                  <option value="sale">For Sale</option>
                </select>
              </Field>
            </div>

            <Field label="Property Type" error={errors.type?.message}>
              <select
                {...register("type", { required: "Property type is required" })}
                className={inputCls(!!errors.type)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* ── Step 1: Location ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Location
            </h2>

            <Field label="City / Area" error={errors.location?.message}>
              <input
                {...register("location", { required: "Location is required" })}
                className={inputCls(!!errors.location)}
                placeholder="e.g. Nairobi"
              />
            </Field>

            <Field label="Neighborhood" error={errors.neighborhood?.message}>
              <input
                {...register("neighborhood", {
                  required: "Neighborhood is required",
                })}
                className={inputCls(!!errors.neighborhood)}
                placeholder="e.g. Kilimani"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude" error={errors.latitude?.message}>
                <input
                  type="number"
                  step="any"
                  {...register("latitude", {
                    required: "Latitude is required",
                    valueAsNumber: true,
                  })}
                  className={inputCls(!!errors.latitude)}
                  placeholder="-1.286389"
                />
              </Field>

              <Field label="Longitude" error={errors.longitude?.message}>
                <input
                  type="number"
                  step="any"
                  {...register("longitude", {
                    required: "Longitude is required",
                    valueAsNumber: true,
                  })}
                  className={inputCls(!!errors.longitude)}
                  placeholder="36.817223"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 2: Details & Amenities ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Details &amp; Amenities
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Bedrooms" error={errors.bedrooms?.message}>
                <input
                  type="number"
                  {...register("bedrooms", {
                    min: { value: 0, message: "Min 0" },
                    valueAsNumber: true,
                  })}
                  className={inputCls(!!errors.bedrooms)}
                  min={0}
                />
              </Field>

              <Field label="Bathrooms" error={errors.bathrooms?.message}>
                <input
                  type="number"
                  {...register("bathrooms", {
                    min: { value: 0, message: "Min 0" },
                    valueAsNumber: true,
                  })}
                  className={inputCls(!!errors.bathrooms)}
                  min={0}
                />
              </Field>

              <Field label="Size (sqft)" error={errors.sqft?.message}>
                <input
                  type="number"
                  {...register("sqft", {
                    min: { value: 0, message: "Min 0" },
                    valueAsNumber: true,
                  })}
                  className={inputCls(!!errors.sqft)}
                  min={0}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field
              label="Availability"
              error={errors.availability_status?.message}
            >
              <select
                {...register("availability_status")}
                className={inputCls(!!errors.availability_status)}
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="taken">Taken</option>
              </select>
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const selected = (watchedAmenities ?? []).includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                        selected
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Images ── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Images
            </h2>
            <ImageUploader
              initialUrls={initialData?.images}
              onChange={setImages}
              onUploadingChange={setUploading}
            />
          </div>
        )}

        {/* Feedback messages */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
            {submitSuccess}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {canSubmitForReview && step === STEPS.length - 1 && (
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={isSubmitting || uploading}
                className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
              >
                Submit for Review
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving…"
                  : isEdit
                    ? "Save Changes"
                    : "Create Listing"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${
    hasError
      ? "border-red-400 dark:border-red-500"
      : "border-gray-300 dark:border-gray-600"
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
