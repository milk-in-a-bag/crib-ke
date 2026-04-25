import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import type { SavedSearch, SearchFilters, UserRole } from "@/types";
import { SavedSearchesList } from "./SavedSearchesList";

export default async function SavedSearchesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field
  const role = session.user.role as UserRole;
  if (!hasRole(role, "seeker")) {
    redirect("/dashboard/profile");
  }

  const rows = await sql`
    SELECT id, user_id, name, filters, created_at
    FROM saved_searches
    WHERE user_id = ${session.user.id}::uuid
    ORDER BY created_at DESC
  `;

  const savedSearches: SavedSearch[] = rows.map((r) => ({
    id: r.id as string,
    user_id: r.user_id as string,
    name: r.name as string,
    filters: r.filters as SearchFilters,
    created_at: r.created_at as string,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Saved Searches
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {savedSearches.length} of 10 saved
          </p>
        </div>

        <SavedSearchesList initialSearches={savedSearches} />
      </div>
    </div>
  );
}
