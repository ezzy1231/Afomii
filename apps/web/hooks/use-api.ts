import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { useAuthStore } from "../stores/auth-store";

function useToken() {
  return useAuthStore((s) => s.token);
}

export function useDashboard(businessId: string | null) {
  const token = useToken();

  return useQuery({
    queryKey: ["dashboard", businessId],
    queryFn: () =>
      apiRequest(`/partners/business/${businessId}/dashboard`, { token: token ?? undefined }),
    enabled: !!businessId,
  });
}

export function useReservations(branchId: string | null) {
  const token = useToken();

  return useQuery({
    queryKey: ["reservations", branchId],
    queryFn: () =>
      apiRequest(`/partners/branches/${branchId}/reservations`, { token: token ?? undefined }),
    enabled: !!branchId,
  });
}

export function useUpdateReservationStatus() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reservationId,
      status,
    }: {
      reservationId: string;
      status: string;
    }) =>
      apiRequest(`/partners/reservations/${reservationId}/status`, {
        method: "PATCH",
        body: { status },
        token: token ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useCheckAvailability() {
  const token = useToken();

  return useMutation({
    mutationFn: (params: {
      branchId: string;
      date: string;
      guestCount: number;
    }) =>
      apiRequest("/reservations/check-availability", {
        method: "POST",
        body: params,
        token: token ?? undefined,
      }),
  });
}

export function useEventAnalytics(organizerId: string | null) {
  const token = useToken();

  return useQuery({
    queryKey: ["events", organizerId],
    queryFn: () =>
      apiRequest(`/partners/business/${organizerId}/dashboard`, {
        token: token ?? undefined,
      }),
    enabled: !!organizerId,
  });
}
