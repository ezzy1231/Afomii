import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get } from "../api/client";
import {
  listRestaurants,
  getRestaurant,
  type RestaurantListFilters,
  type RestaurantListItem,
  type RestaurantDetail,
} from "../api/endpoints/restaurants";
import {
  checkAvailability,
  getMyReservations,
  type AvailabilityResult,
  type ReservationsEnvelope,
} from "../api/endpoints/reservations";

export const qk = {
  restaurants: (filters?: RestaurantListFilters) =>
    ["restaurants", filters ?? {}] as const,
  restaurant: (id: string) => ["restaurant", id] as const,
  availability: (branchId: string, date: string, guestCount: number) =>
    ["availability", branchId, date, guestCount] as const,
  myReservations: (status?: string) => ["my-reservations", status ?? "all"] as const,
};

export function useRestaurants(filters: RestaurantListFilters = {}) {
  return useQuery({
    queryKey: qk.restaurants(filters),
    queryFn: () => listRestaurants(filters),
    staleTime: 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: qk.restaurant(id),
    queryFn: () => getRestaurant(id),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAvailability(
  branchId: string,
  date: string,
  guestCount: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: qk.availability(branchId, date, guestCount),
    queryFn: () => checkAvailability({ branchId, date, guestCount }),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useMyReservations(status?: string) {
  return useQuery({
    queryKey: qk.myReservations(status),
    queryFn: () => getMyReservations({ status }),
    staleTime: 30_000,
    retry: 1,
  });
}

// Re-export shared types for screens that need them without deep imports.
export type { RestaurantListItem, RestaurantDetail, AvailabilityResult, ReservationsEnvelope };
