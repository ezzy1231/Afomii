import { z } from "zod";
import { reportError } from "@/lib/monitoring";

/**
 * Server Action input validation (PRODUCTION_READINESS_PLAN M1/F1).
 *
 * Every mutating Server Action validates its input through one of these schemas
 * before touching Supabase. RLS remains the real security boundary; this layer
 * exists to give users fast, specific feedback and to keep garbage out of the
 * database.
 */

export const uuidSchema = z.string().uuid("Invalid identifier.");

const trimmed = (max: number) => z.string().trim().max(max);

// ── Discovery / partner listing creation ────────────────────────────────

export const restaurantListingInputSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name must be at least 2 characters.").max(120),
  cuisine: trimmed(80).optional(),
  areaLabel: trimmed(120).optional(),
  city: z.string().trim().min(1, "City is required.").max(80),
  closingLabel: trimmed(120).optional(),
});

// Public banner URL from Supabase Storage (banners bucket). The server action
// verifies it points at our project so a listing can't embed arbitrary URLs.
export const bannerUrlSchema = z
  .string()
  .trim()
  .min(1, "A banner image is required.")
  .max(500)
  .refine(
    (v) => v.startsWith("https://") && v.includes("/storage/v1/object/public/banners/"),
    { message: "Banner must be a public upload from the banners storage bucket." }
  );

export const restaurantListingWithBannerSchema = restaurantListingInputSchema.extend({
  coverUrl: bannerUrlSchema,
});

export const eventListingInputSchema = z.object({
  title: z.string().trim().min(2, "Event title must be at least 2 characters.").max(160),
  category: trimmed(80).optional(),
  venueName: z.string().trim().min(1, "Venue is required.").max(160),
  startsAt: z
    .string()
    .trim()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), {
      message: "Please provide a valid date and time.",
    })
    .optional(),
  priceLabel: trimmed(60).optional(),
});

export const eventListingWithBannerSchema = eventListingInputSchema.extend({
  coverImageUrl: bannerUrlSchema,
});

export const branchInputSchema = z.object({
  branchName: z.string().trim().min(1, "Branch name is required.").max(120),
  address: z.string().trim().min(1, "Address is required.").max(240),
  phone: trimmed(30).optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable(),
  longitude: z.coerce.number().min(-180).max(180).nullable(),
});

export const bookingConfigInputSchema = z.object({
  branchId: uuidSchema,
  bookingMode: z.enum(["instant", "request", "closed"]),
  totalTables: z.coerce.number().int().min(0).max(10_000),
  maxGuestPerTable: z.coerce.number().int().min(1).max(500),
  slotDurationMinutes: z.coerce.number().int().min(10).max(480),
  advanceNoticeHours: z.coerce.number().int().min(0).max(720),
  cancellationPolicy: z.string().trim().max(500).optional(),
});

export const openingHoursSchema = z.record(
  z.string().max(10),
  z
    .array(
      z.object({
        open: z.string().regex(/^\d{1,2}:\d{2}$/),
        close: z.string().regex(/^\d{1,2}:\d{2}$/),
      })
    )
    .max(2)
);

// ── Consumer reservations ────────────────────────────────────────────────

export const reservationInputSchema = z.object({
  branchId: uuidSchema,
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid date."),
  timeSlot: z.string().trim().min(1, "Please choose a time.").max(20),
  guestCount: z.coerce.number().int().min(1, "At least one guest is required.").max(99),
});

export const reservationStatusSchema = z.enum(["pending", "confirmed", "rejected", "cancelled", "completed"]);

// ── Ticketing ────────────────────────────────────────────────────────────

export const purchaseTicketsInputSchema = z.object({
  ticketTypeId: uuidSchema,
  quantity: z.coerce.number().int().min(1).max(100),
});

export const ticketTierEnum = z.enum(["standard", "vip", "early_bird", "group"]);

export const ticketTierInputSchema = z.object({
  id: uuidSchema.optional(),
  eventId: uuidSchema,
  name: z.string().trim().min(1, "Tier name is required.").max(120),
  tier: ticketTierEnum,
  price: z.coerce.number().min(0, "Enter a valid price.").max(1_000_000),
  totalQuantity: z.coerce.number().int().min(1, "Total quantity must be at least 1.").max(1_000_000),
  salesStart: z.string().nullable().optional(),
  salesEnd: z.string().nullable().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────

/** First human-readable issue message from a failed parse. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

/**
 * Server-side log line for action failures — the single seam for action
 * error reporting. Routes through reportError() so Sentry captures every
 * action failure when SENTRY_DSN is configured (see lib/monitoring.ts);
 * console.error remains the local/CI behavior.
 */
export function logActionError(action: string, err: unknown): void {
  reportError(`action:${action}`, err);
}

// -- Platform admin -------------------------------------------------------

export const userRoleSchema = z.enum([
  "customer",
  "food_business",
  "event_organizer",
  "system_admin",
]);

export const eventModerationActionSchema = z.enum(["publish", "unpublish", "cancel"]);