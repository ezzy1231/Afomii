import { get, post, patch } from "../client";

export type AvailabilitySlot = { time: string; available: boolean };

export type AvailabilityResult = {
  bookingMode: "WALK_IN_ONLY" | "TIME_SLOT" | "REQUEST_BASED";
  date: string;
  timeSlotDurationMinutes?: number;
  maxGuestPerTable?: number;
  requirePrepayment?: boolean;
  available?: boolean;
  slots?: AvailabilitySlot[];
  message?: string;
};

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "REJECTED";

export type ReservationBranchRef = {
  id: string;
  branchName: string;
  address: string | null;
  business: { id: string; name: string; coverUrl: string | null } | null;
};

export type Reservation = {
  id: string;
  reservationCode: string;
  status: ReservationStatus;
  guestCount: number;
  reservationDate: string;
  timeSlot: string | null;
  specialRequests: string | null;
  createdAt: string;
  branch: ReservationBranchRef;
};

export type ReservationsEnvelope = {
  data: Reservation[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function checkAvailability(params: {
  branchId: string;
  date: string;
  guestCount: number;
}) {
  return post<AvailabilityResult>("/reservations/check-availability", params);
}

export function createReservation(params: {
  branchId: string;
  reservationDate: string;
  timeSlot?: string;
  guestCount: number;
  specialRequests?: string;
}) {
  return post<Reservation>("/reservations", params);
}

export function getMyReservations(filters: {
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.limit != null) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return get<ReservationsEnvelope>(
    `/reservations/mine${qs ? `?${qs}` : ""}`
  );
}

export function cancelReservation(id: string) {
  return patch<Reservation>(`/reservations/${id}/cancel`);
}
