import { create } from "zustand";

export type CreatedReservation = {
  code: string;
  status: string;
  date: string;
  timeSlot: string | null;
  guestCount: number;
  branchName: string;
  businessName: string;
  cancellationPolicyText?: string | null;
};

type BookingState = {
  branchId?: string;
  branchName?: string;
  date?: string;
  timeSlot?: string;
  guestCount: number;
  specialRequests: string;
  created?: CreatedReservation;
  setDraft: (d: Partial<Omit<BookingState, "setDraft" | "reset">>) => void;
  setCreated: (c: CreatedReservation) => void;
  reset: () => void;
};

export const useBookingStore = create<BookingState>((set) => ({
  guestCount: 2,
  specialRequests: "",
  setDraft: (d) => set((s) => ({ ...s, ...d })),
  setCreated: (c) => set({ created: c }),
  reset: () => set({ guestCount: 2, specialRequests: "", timeSlot: undefined, created: undefined }),
}));
