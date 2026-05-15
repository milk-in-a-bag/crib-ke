// Type-only export — the actual UI lives in AdminQueueClient
import type { PropertyType, PriceType } from "@/types";

export interface AdminQueueListing {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  price_type: PriceType;
  neighborhood: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  amenities: string[];
  images: string[];
  latitude: number;
  longitude: number;
  availability_status: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  created_at: string;
}
