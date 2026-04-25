"use client";

import { useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { SavedSearchCard } from "@/components/SavedSearchCard";
import type { SavedSearch } from "@/types";

interface SavedSearchesListProps {
  readonly initialSearches: SavedSearch[];
}

export function SavedSearchesList({ initialSearches }: SavedSearchesListProps) {
  const [searches, setSearches] = useState<SavedSearch[]>(initialSearches);

  const handleDelete = (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  if (searches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <BookmarkIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No saved searches yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Use the filters on the Explore page and save a search to get notified
          when new listings match.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {searches.map((s) => (
        <SavedSearchCard key={s.id} savedSearch={s} onDelete={handleDelete} />
      ))}
    </div>
  );
}
