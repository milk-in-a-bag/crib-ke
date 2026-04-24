import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasRole } from "@/lib/rbac";
import { ListingForm } from "@/components/ListingForm";
import type { UserRole } from "@/types";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field
  const role = session.user.role as UserRole;
  if (!hasRole(role, "owner", "agent")) {
    redirect("/dashboard/profile");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Listing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fill in the details below to create your property listing.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8">
          <ListingForm />
        </div>
      </div>
    </div>
  );
}
