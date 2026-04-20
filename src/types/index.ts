// Enums matching DB
export type UserRole = "seeker" | "owner" | "agent";
export type PriceType = "rent" | "sale";
export type PropertyType =
  | "bedsitter"
  | "one_bedroom"
  | "two_bedroom"
  | "three_bedroom"
  | "studio"
  | "villa"
  | "townhouse";
export type AvailabilityStatus = "available" | "reserved" | "taken";
export type ReviewTargetType = "property" | "area" | "landlord" | "caretaker";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

// Full property record (detail page)
export interface PropertyDetail {
  id: string;
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
  images: string[];
  amenities: string[];
  availability_status: AvailabilityStatus;
  owner_id: string;
  created_at: string;
  // joined
  area?: AreaRecord;
  rating?: number;
  review_count?: number;
}

// Lean type for list/map views
export interface PropertyListItem {
  id: string;
  title: string;
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
  images: string[];
  availability_status: AvailabilityStatus;
  rating?: number;
  review_count?: number;
}

export interface MapProperty {
  id: string;
  title: string;
  price: number;
  price_type: PriceType;
  latitude: number;
  longitude: number;
  images: string[];
}

export interface AreaRecord {
  id: string;
  name: string;
  safety_score: number;
  water_score: number;
  commute_score: number;
  internet_score: number;
  flooding_score: number;
  summary: string;
  updated_at: string;
}

export interface DbReview {
  id: string;
  user_id: string;
  target_type: ReviewTargetType;
  target_id: string;
  rating: number;
  comment: string;
  verified_tenant: boolean;
  helpful_count: number;
  created_at: string;
  // joined
  author_name?: string;
  author_avatar?: string;
}

export interface BookingRecord {
  id: string;
  user_id: string;
  property_id: string;
  scheduled_date: string;
  status: BookingStatus;
  created_at: string;
}

// API response envelopes
export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface SingleResponse<T> {
  data: T;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
