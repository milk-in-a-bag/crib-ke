"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface SaveButtonProps {
  propertyId: string;
  initialSaved?: boolean;
  savedId?: string | null;
  className?: string;
}

export function SaveButton({
  propertyId,
  initialSaved = false,
  savedId: initialSavedId = null,
  className = "",
}: SaveButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [savedId, setSavedId] = useState<string | null>(initialSavedId);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (loading) return;

    // Optimistic update
    const prevSaved = saved;
    const prevSavedId = savedId;
    setSaved(!saved);
    setLoading(true);

    try {
      if (prevSaved && prevSavedId) {
        const res = await fetch(`/api/saved/${prevSavedId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          // Revert on failure
          setSaved(prevSaved);
          setSavedId(prevSavedId);
        } else {
          setSavedId(null);
        }
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property_id: propertyId }),
        });
        if (!res.ok) {
          // Revert on failure (including 409 already-saved)
          setSaved(prevSaved);
          setSavedId(prevSavedId);
        } else {
          const json = await res.json();
          setSavedId(json.data?.id ?? null);
        }
      }
    } catch {
      // Revert on network error
      setSaved(prevSaved);
      setSavedId(prevSavedId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={saved ? "Remove from saved" : "Save property"}
      className={`flex items-center justify-center transition-colors disabled:opacity-60 ${className}`}
    >
      {saved ? (
        <BookmarkCheck className="w-5 h-5 text-accent fill-accent" />
      ) : (
        <Bookmark className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
}
