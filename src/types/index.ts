// Enums matching DB
export type UserRole = "seeker" | "owner" | "agent" | "admin";
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected";
export type NotificationType =
  | "listing_approved"
  | "listing_rejected"
  | "new_inquiry"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "new_listing_match";
export type AreaDimension =
  | "safety"
  | "water"
  | "commute"
  | "internet"
  | "flooding";
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
  listing_status: ListingStatus;
  published_at?: string;
  rejection_reason?: string;
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
  listing_status: ListingStatus;
  published_at?: string;
  rejection_reason?: string;
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

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  created_at: string;
}

export interface CommunityRating {
  id: string;
  user_id: string;
  area_id: string;
  dimension: AreaDimension;
  value: number;
  created_at: string;
}

export interface SearchFilters {
  q?: string;
  min_price?: number;
  max_price?: number;
  min_price_per_sqft?: number;
  max_price_per_sqft?: number;
  type?: PropertyType;
  price_type?: PriceType;
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  radius_km?: number;
  lat?: number;
  lng?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "best_match" | "distance";
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  created_at: string;
}

export interface BookingWithDetails extends BookingRecord {
  seeker_name: string;
  seeker_email: string;
  listing_title: string;
}
