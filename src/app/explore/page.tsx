import { Explore } from "@/views/Explore";
import type { PropertyListItem, ListResponse } from "@/types";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  // Build query string from searchParams for the initial server-side fetch
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value !== undefined) {
      params.set(key, Array.isArray(value) ? value[0] : value);
    }
  }

  let initialProperties: PropertyListItem[] = [];
  let initialTotal = 0;

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/properties?${params.toString()}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json: ListResponse<PropertyListItem> = await res.json();
      initialProperties = json.data;
      initialTotal = json.total;
    }
  } catch (err) {
    console.error("explore page: failed to fetch initial properties", err);
  }

  // Flatten searchParams to Record<string, string> for the client component
  const initialSearchParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (value !== undefined) {
      initialSearchParams[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  return (
    <Explore
      initialProperties={initialProperties}
      initialTotal={initialTotal}
      initialSearchParams={initialSearchParams}
    />
  );
}
