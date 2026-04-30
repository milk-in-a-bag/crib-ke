import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/types";
import { SeekerDashboard } from "./SeekerDashboard";
import { OwnerDashboard } from "./OwnerDashboard";
import { AdminDashboard } from "./AdminDashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // @ts-expect-error role is a custom field attached in the JWT callback
  const role = session.user.role as UserRole;
  const userId = session.user.id;
  const displayName = session.user.name ?? session.user.email ?? "there";

  switch (role) {
    case "seeker":
      return <SeekerDashboard userId={userId} displayName={displayName} />;

    case "owner":
    case "agent":
      return <OwnerDashboard userId={userId} />;

    case "admin":
      return <AdminDashboard />;

    default:
      redirect("/auth/signin");
  }
}
