const { z } = require("zod");

const UserRoleEnum = z.enum([
  "CUSTOMER",
  "RESTAURANT_ADMIN",
  "EVENT_ORGANIZER",
  "SYSTEM_ADMIN",
]);

const ReservationStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "REJECTED",
]);

const BookingModeEnum = z.enum([
  "WALK_IN_ONLY",
  "TIME_SLOT",
  "REQUEST_BASED",
]);

const TicketTierEnum = z.enum([
  "GENERAL",
  "VIP",
  "EARLY_BIRD",
  "GROUP",
]);

const EventStatusEnum = z.enum(["DRAFT", "PUBLISHED", "COMPLETED"]);

const SignupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(8).max(128),
  role: UserRoleEnum,
  language: z.string().length(2).default("en"),
  country: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: "Email or phone is required",
});

const LoginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  language: z.string().length(2).optional(),
  country: z.string().max(100).optional(),
});

const SavePreferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  defaultLocation: z.string().optional(),
});

const BusinessRegisterSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  ownerName: z.string().min(1).max(100),
  businessEmail: z.string().email(),
  businessPhone: z.string().min(7).max(20),
  licenseUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

const BranchRegisterSchema = z.object({
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

const OrganizerRegisterSchema = z.object({
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

const CheckAvailabilitySchema = z.object({
  branchId: z.string().uuid(),
  date: z.string(),
  guestCount: z.number().int().min(1),
});

const CreateReservationSchema = z.object({
  branchId: z.string().uuid(),
  reservationDate: z.string(),
  timeSlot: z.string().optional(),
  guestCount: z.number().int().min(1),
  specialRequests: z.string().max(500).optional(),
});

const UpdateReservationStatusSchema = z.object({
  status: ReservationStatusEnum,
  proposedDateTime: z.string().optional(),
});

const HoldTicketSchema = z.object({
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const CheckoutTicketsSchema = z.object({
  holdToken: z.string(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

const RideEstimateSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  pickupAddress: z.string().optional(),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().optional(),
});

const RideDispatchSchema = z.object({
  providerName: z.string(),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
});

module.exports = {
  UserRoleEnum,
  ReservationStatusEnum,
  BookingModeEnum,
  TicketTierEnum,
  EventStatusEnum,
  SignupSchema,
  LoginSchema,
  RefreshTokenSchema,
  UpdateProfileSchema,
  SavePreferencesSchema,
  BusinessRegisterSchema,
  BranchRegisterSchema,
  OrganizerRegisterSchema,
  CheckAvailabilitySchema,
  CreateReservationSchema,
  UpdateReservationStatusSchema,
  HoldTicketSchema,
  CheckoutTicketsSchema,
  RideEstimateSchema,
  RideDispatchSchema,
};