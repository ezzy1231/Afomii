import { get } from "../client";

export type DayRange = { open: string; close: string };

export type RestaurantBranchSummary = {
  id: string;
  branchName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  bookingMode: "WALK_IN_ONLY" | "TIME_SLOT" | "REQUEST_BASED";
  acceptsBookings: boolean;
  isOpenNow: boolean;
  distanceKm?: number;
};

export type RestaurantListItem = {
  id: string;
  name: string;
  category: string;
  logoUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  openingHours: Record<string, DayRange[]>;
  branches: RestaurantBranchSummary[];
};

export type RestaurantListEnvelope = {
  data: RestaurantListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  description?: string | null;
};

export type BranchBookingConfig = {
  id: string;
  bookingMode: "WALK_IN_ONLY" | "TIME_SLOT" | "REQUEST_BASED";
  timeSlotDurationMinutes: number;
  totalTables: number;
  maxGuestPerTable: number;
  requirePrepayment: boolean;
  prepaymentType?: string | null;
  prepaymentValue?: number | null;
  cancellationPolicyText?: string | null;
};

export type RestaurantBranchDetail = {
  id: string;
  branchName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  bookingConfig: BranchBookingConfig | null;
  menuItems: MenuItem[];
};

export type RestaurantDetail = {
  id: string;
  name: string;
  category: string;
  logoUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  openingHours: Record<string, DayRange[]>;
  menuByCategory: Record<string, MenuItem[]>;
  branches: RestaurantBranchDetail[];
};

export type RestaurantListFilters = {
  lat?: number;
  lng?: number;
  category?: string;
  search?: string;
  openNow?: boolean;
  page?: number;
  limit?: number;
};

export function listRestaurants(filters: RestaurantListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.lat != null) params.set("lat", String(filters.lat));
  if (filters.lng != null) params.set("lng", String(filters.lng));
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.openNow != null) params.set("openNow", String(filters.openNow));
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return get<RestaurantListEnvelope>(
    `/partners/restaurants${qs ? `?${qs}` : ""}`
  );
}

export function getRestaurant(id: string) {
  return get<RestaurantDetail>(`/partners/restaurants/${id}`);
}
