import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────

export const UserRoleEnum = z.enum([
  "CUSTOMER",
  "RESTAURANT_ADMIN",
  "EVENT_ORGANIZER",
  "SYSTEM_ADMIN",
]);

export const ReservationStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "REJECTED",
]);

export const BookingModeEnum = z.enum([
  "WALK_IN_ONLY",
  "TIME_SLOT",
  "REQUEST_BASED",
]);

export const TicketTierEnum = z.enum([
  "GENERAL",
  "VIP",
  "EARLY_BIRD",
  "GROUP",
]);

export const EventStatusEnum = z.enum(["DRAFT", "PUBLISHED", "COMPLETED"]);

// ─── Auth ─────────────────────────────────────────────────────────

export const SignupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  role: UserRoleEnum,
  language: z.string().length(2).default("en"),
  country: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: "Email or phone is required",
});

export const LoginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// ─── User Profile ─────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  language: z.string().length(2).optional(),
  country: z.string().max(100).optional(),
});

export const SavePreferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  defaultLocation: z.string().optional(),
});

// ─── Business Registration ────────────────────────────────────────

export const BusinessRegisterSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  ownerName: z.string().min(1).max(100),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(7).max(20),
  licenseUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export const BranchRegisterSchema = z.object({
  businessId: z.string().uuid(),
  branchName: z.string().min(1).max(200),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional(),
  openingHours: z.record(
    z.string(),
    z.array(
      z.object({
        open: z.string(),
        close: z.string(),
      })
    )
  ).optional(),
  cuisineTypes: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
});

export const OrganizerRegisterSchema = z.object({
  businessName: z.string().min(1).max(200),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(7).max(20),
  verificationDocs: z.array(z.string().url()).optional(),
  payoutSettings: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
  }).optional(),
});

// ─── Reservations ─────────────────────────────────────────────────

export const CheckAvailabilitySchema = z.object({
  branchId: z.string().uuid(),
  date: z.string(),
  guestCount: z.number().int().min(1),
});

export const CreateReservationSchema = z.object({
  branchId: z.string().uuid(),
  reservationDate: z.string(),
  timeSlot: z.string().optional(),
  guestCount: z.number().int().min(1),
  specialRequests: z.string().max(500).optional(),
});

export const UpdateReservationStatusSchema = z.object({
  status: ReservationStatusEnum,
  proposedDateTime: z.string().optional(),
});

// ─── Ticketing ────────────────────────────────────────────────────

export const HoldTicketSchema = z.object({
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const CheckoutTicketsSchema = z.object({
  holdToken: z.string(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

// ─── Ride ─────────────────────────────────────────────────────────

export const RideEstimateSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  pickupAddress: z.string().optional(),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().optional(),
});

export const RideDispatchSchema = z.object({
  providerName: z.string(),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
});
