import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { createClient } from "@/lib/supabase/client";

function useToken() {
  return async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };
}

export function useDashboard(businessId: string | null) {
  const getToken = useToken();

  return useQuery({
    queryKey: ["dashboard", businessId],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest(`/partners/business/${businessId}/dashboard`, { token: token ?? undefined });
    },
    enabled: !!businessId,
  });
}

export function useReservations(branchId: string | null) {
  const getToken = useToken();

  return useQuery({
    queryKey: ["reservations", branchId],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest(`/partners/branches/${branchId}/reservations`, { token: token ?? undefined });
    },
    enabled: !!branchId,
  });
}

export function useUpdateReservationStatus() {
  const getToken = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reservationId,
      status,
    }: {
      reservationId: string;
      status: string;
    }) => {
      const token = await getToken();
      return apiRequest(`/partners/reservations/${reservationId}/status`, {
        method: "PATCH",
        body: { status },
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useCheckAvailability() {
  const getToken = useToken();

  return useMutation({
    mutationFn: async (params: {
      branchId: string;
      date: string;
      guestCount: number;
    }) => {
      const token = await getToken();
      return apiRequest("/reservations/check-availability", {
        method: "POST",
        body: params,
        token: token ?? undefined,
      });
    },
  });
}

export function useEventAnalytics(organizerId: string | null) {
  const getToken = useToken();

  return useQuery({
    queryKey: ["events", organizerId],
    queryFn: async () => {
      const token = await getToken();
      return apiRequest(`/partners/business/${organizerId}/dashboard`, {
        token: token ?? undefined,
      });
    },
    enabled: !!organizerId,
  });
}
