'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  branchInputSchema,
  bookingConfigInputSchema,
  eventListingInputSchema,
  eventListingWithBannerSchema,
  eventModerationActionSchema,
  firstIssue,
  firstTicketTierSchema,
  logActionError,
  openingHoursSchema,
  restaurantListingWithBannerSchema,
  reservationStatusSchema,
  restaurantListingInputSchema,
  userRoleSchema,
  uuidSchema,
  verificationDecisionSchema,
  verificationRequestSchema,
} from '@/lib/validation'
import { ACTION_LIMITS, RATE_LIMIT_MESSAGE, guardActionLimit } from '@/lib/rate-limit'
import { organizerIsPublic } from '@/lib/dashboard/organizer-data'

export type DashboardActionState = {
  ok: boolean
  message: string
  id?: string
}

const defaultErrorState: DashboardActionState = {
  ok: false,
  message: 'Something went wrong. Please try again.',
}

const profileField = z.string().trim().max(2000)
const imageUrlField = z.string().trim().max(500).refine(
  (value) => !value || (value.startsWith('https://') && value.includes('/storage/v1/object/public/banners/')),
  'Choose an image uploaded to your UrbanExplore banner storage.',
)
const partnerProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().or(z.literal('')),
  phone: z.string().trim().max(40),
  city: z.string().trim().max(100),
  accountName: z.string().trim().min(2).max(160),
  category: z.string().trim().max(120),
  address: z.string().trim().max(240),
  website: z.string().trim().max(300).refine((value) => !value || /^https:\/\//i.test(value), 'Website must start with https://.'),
  description: profileField,
  logoUrl: imageUrlField,
  coverUrl: imageUrlField,
  listingId: z.string().uuid().or(z.literal('')),
  listingName: z.string().trim().max(160),
  cuisine: z.string().trim().max(120),
  neighborhood: z.string().trim().max(120),
})

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string') return ''
  return value.trim()
}

/**
 * A blank optional number input arrives as an empty string, which
 * `z.coerce.number()` would happily turn into 0. Map it to null so an unset
 * coordinate stays unset instead of pointing at 0,0.
 */
function blankToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

async function getCurrentUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null as string | null, isSuspended: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_suspended')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return { supabase, user: null, role: null as string | null, isSuspended: false }

  return {
    supabase,
    user,
    role: (profile.role as string | undefined) ?? null,
    isSuspended: profile.is_suspended === true,
  }
}

export async function createRestaurantListing(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }

  // Rate limit creation before validation (authed partners, key by user id).
  const limit = guardActionLimit('createRestaurantListing', user.id, ACTION_LIMITS.createListing)
  if (!limit.ok) return { ok: false, message: RATE_LIMIT_MESSAGE }

  if (role !== 'food_business') {
    return { ok: false, message: 'Only food business accounts can create restaurant listings.' }
  }

  const parsed = restaurantListingWithBannerSchema.safeParse({
    name: readText(formData, 'name'),
    cuisine: readText(formData, 'cuisine'),
    areaLabel: readText(formData, 'areaLabel'),
    city: readText(formData, 'city'),
    closingLabel: readText(formData, 'closingLabel'),
    coverUrl: readText(formData, 'coverUrl'),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { name, cuisine, areaLabel, city, closingLabel, coverUrl } = parsed.data

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) {
    return {
      ok: false,
      message: 'No linked business profile found. Complete business signup first.',
    }
  }

  const { data: listing, error } = await supabase.from('restaurants').insert({
    business_id: business.id,
    name,
    cuisine: cuisine || null,
    area_label: areaLabel || null,
    city,
    closing_label: closingLabel || null,
    cover_url: coverUrl,
    is_active: true,
  }).select('id').maybeSingle()

  if (error || !listing) {
    logActionError('createRestaurantListing', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/restaurant')
  revalidatePath('/dashboard/restaurant/listings')
  revalidatePath(`/dashboard/restaurant/listings/${listing.id}`)
  revalidatePath('/restaurants')

  return { ok: true, id: listing.id, message: `Restaurant listing created for ${name}.` }
}

export async function createEventListing(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role, isSuspended } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }

  // Rate limit creation before validation (authed organizers).
  const limit = guardActionLimit('createEventListing', user.id, ACTION_LIMITS.createListing)
  if (!limit.ok) return { ok: false, message: RATE_LIMIT_MESSAGE }

  if (role !== 'event_organizer') {
    return { ok: false, message: 'Only event organizer accounts can create event listings.' }
  }

  // The first ticket tier is optional, but offering it here is what makes a
  // new event buyable without a second visit to the ticket manager.
  const wantsTier = readText(formData, 'addTicketTier') === 'on'
  const requestedTier = readText(formData, 'tierType') || 'early_bird'
  const databaseTier = requestedTier === 'general_admission'
    ? 'standard'
    : requestedTier === 'vvip'
      ? 'vip'
      : requestedTier
  const rawTier = wantsTier
    ? {
        name: readText(formData, 'tierName'),
        tier: databaseTier,
        price: readText(formData, 'tierPrice'),
        totalQuantity: readText(formData, 'tierQuantity'),
      }
    : null

  const tierParsed = rawTier ? firstTicketTierSchema.safeParse(rawTier) : null
  // A half-filled tier block should block the submit, not silently skip.
  if (tierParsed && !tierParsed.success) {
    return { ok: false, message: firstIssue(tierParsed.error) }
  }
  const firstTier = tierParsed?.success ? tierParsed.data : null

  const publishNow = readText(formData, 'publishMode') !== 'draft'
  const eventInput = {
    title: readText(formData, 'title'),
    // Blank select maps to undefined so the optional enum accepts it.
    category: readText(formData, 'category') || undefined,
    description: readText(formData, 'description'),
    venueName: readText(formData, 'venueName'),
    startsAt: readText(formData, 'startsAt'),
    endDateTime: readText(formData, 'endDateTime'),
    priceLabel: readText(formData, 'priceLabel'),
    // Same blank-to-null treatment as addBranch: z.coerce.number() would turn
    // an empty field into 0,0 in the Gulf of Guinea.
    latitude: blankToNull(formData.get('latitude')),
    longitude: blankToNull(formData.get('longitude')),
  }
  const coverImageUrl = readText(formData, 'coverImageUrl')
  const parsed = publishNow
    ? eventListingWithBannerSchema.safeParse({ ...eventInput, coverImageUrl })
    : eventListingInputSchema.safeParse(eventInput)
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const {
    title,
    category,
    description,
    venueName,
    startsAt,
    endDateTime,
    priceLabel,
    latitude,
    longitude,
  } = parsed.data
  const startsAtDate = startsAt ? new Date(startsAt) : null
  const endDateTimeDate = endDateTime ? new Date(endDateTime) : null

  const { data: organizerRow } = await supabase
    .from('organizers')
    .select('id, status, is_verified')
    .eq('owner_id', user.id)
    .maybeSingle()

  const organizer = organizerRow as
    | { id: string; status: string | null; is_verified: boolean | null }
    | null

  if (!organizer) {
    return {
      ok: false,
      message: 'No linked organizer profile found. Complete organizer signup first.',
    }
  }

  // Returning the new id lets the optional first tier attach to this event.
  const { data: created, error } = await supabase
    .from('events')
    .insert({
      organizer_id: organizer.id,
      title,
      description: description || null,
      category: category || null,
      venue_name: venueName,
      latitude,
      longitude,
      starts_at: startsAtDate ? startsAtDate.toISOString() : null,
      end_date_time: endDateTimeDate ? endDateTimeDate.toISOString() : null,
      price_label: priceLabel || null,
      cover_image_url: publishNow ? coverImageUrl : coverImageUrl || null,
      is_active: publishNow,
      status: publishNow ? 'published' : 'draft',
    })
    .select('id')
    .single()

  if (error || !created) {
    logActionError('createEventListing', error ?? new Error('Event insert returned no row'))
    // `42501` here means `events_select_owner` is still the row-lookup form
    // (`event_organizer_is_self(id)`), which cannot see the row being inserted,
    // so every draft — and every event for an organizer awaiting verification —
    // is rejected while the insert itself actually succeeded. A generic
    // "something went wrong" left the organizer with nothing to act on.
    if ((error as { code?: string } | null)?.code === '42501') {
      return {
        ok: false,
        message:
          'The database rejected this event. Apply migration 0020_event_insert_ownership_policy.sql, then try again.',
      }
    }
    return defaultErrorState
  }

  // Optional first tier. A failure here must not lose the event the organizer
  // just created, so it is logged and reported rather than rolled back.
  let tierNote = ''
  if (firstTier) {
    const { error: tierError } = await supabase.from('ticket_types').insert({
      event_id: created.id,
      name: firstTier.name,
      tier: firstTier.tier,
      price: firstTier.price,
      total_quantity: firstTier.totalQuantity,
      remaining_quantity: firstTier.totalQuantity,
    })

    if (tierError) {
      logActionError('createEventListing.tier', tierError)
      tierNote = ' The ticket tier was not saved — add it under Ticket Management.'
    } else {
      tierNote = ` Ticket "${firstTier.name}" is live at ETB ${firstTier.price}.`
    }
  }

  revalidatePath('/dashboard/organizer')
  revalidatePath('/dashboard/organizer/events')
  revalidatePath('/dashboard/organizer/tickets')
  revalidatePath('/events')
  // revalidatePath does not evict lib/catalogue.ts's unstable_cache entry, so
  // the home page and /events kept serving the previous list for up to a minute.
  revalidateTag('event-catalogue')

  // `published` only means "public" when the organizer profile clears
  // private.organizer_is_public(). If it does not, the row is invisible on every
  // consumer surface, so say so rather than reporting an unqualified success.
  const isPublic = organizerIsPublic(organizer, isSuspended)
  const visibilityNote = publishNow && !isPublic
    ? ' It is live in your dashboard but hidden from the public feed until your organizer profile is verified.'
    : ''

  return {
    ok: true,
    message: publishNow
      ? `Event published: ${title}.${tierNote}${visibilityNote}`
      : `Draft saved: ${title}.${tierNote}`,
  }
}

export async function updateReservationStatus(
  id: string,
  status: string
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(id)
  const statusCheck = reservationStatusSchema.safeParse(status)
  if (!idCheck.success || !statusCheck.success) {
    return { ok: false, message: 'Invalid reservation status.' }
  }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can manage reservations.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: branches } = await supabase
    .from('branches')
    .select('id')
    .eq('business_id', business.id)
  const branchIds = (branches ?? []).map((b) => b.id)
  if (!branchIds.length) return { ok: false, message: 'No branches found.' }

  const { data: existing } = await supabase
    .from('reservations')
    .select('id, branch_id')
    .eq('id', idCheck.data)
    .maybeSingle()
  if (!existing || !branchIds.includes(existing.branch_id)) {
    return { ok: false, message: 'Reservation not found or not authorized.' }
  }

  const { error } = await supabase.from('reservations').update({ status }).eq('id', idCheck.data)
  if (error) {
    logActionError('updateReservationStatus', error)
    return defaultErrorState
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'reservation_status_change',
    entity_type: 'reservation',
    entity_id: id,
    metadata: { status },
  })
  if (auditError) logActionError('updateReservationStatus.audit', auditError)

  revalidatePath('/dashboard/restaurant/reservations')
  return { ok: true, message: `Reservation marked ${status}.` }
}

/** Check in by the opaque booking code printed on the guest's reservation QR. */
export async function checkInReservation(code: string): Promise<DashboardActionState> {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-F0-9]{12}$/.test(normalized)) {
    return { ok: false, message: 'Enter a valid 12-character booking code.' }
  }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can check in reservations.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: branches } = await supabase
    .from('branches')
    .select('id')
    .eq('business_id', business.id)
  const branchIds = (branches ?? []).map((branch) => branch.id)
  if (!branchIds.length) return { ok: false, message: 'No branches found.' }

  const { data: booking } = await supabase
    .from('reservations')
    .select('id, branch_id, status, checked_in_at')
    .eq('booking_code', normalized)
    .in('branch_id', branchIds)
    .maybeSingle()

  if (!booking) return { ok: false, message: 'No reservation matches that code for your business.' }
  if (booking.checked_in_at) return { ok: true, message: 'This guest was already checked in.' }
  if (booking.status !== 'confirmed') {
    return { ok: false, message: 'Only confirmed reservations can be checked in.' }
  }

  const checkedInAt = new Date().toISOString()
  const { data: updated, error } = await supabase
    .from('reservations')
    .update({ checked_in_at: checkedInAt, status: 'completed' })
    .eq('id', booking.id)
    .eq('status', 'confirmed')
    .is('checked_in_at', null)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    logActionError('checkInReservation', error ?? new Error('Reservation was already checked in'))
    return { ok: false, message: 'This reservation could not be checked in. Refresh and try again.' }
  }

  revalidatePath('/dashboard/restaurant/reservations')
  revalidatePath('/settings')
  return { ok: true, message: 'Guest checked in.' }
}

export async function suggestReservationTime(id: string, suggestedTime: string): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(id)
  if (!idCheck.success || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(suggestedTime)) {
    return { ok: false, message: 'Choose a valid time.' }
  }
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') return { ok: false, message: 'Only restaurant partners can suggest a new time.' }

  const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }
  const { data: branches } = await supabase.from('branches').select('id').eq('business_id', business.id)
  const branchIds = (branches ?? []).map((branch) => branch.id)
  const { data: booking } = await supabase
    .from('reservations')
    .select('id, branch_id, status, time_slot')
    .eq('id', idCheck.data)
    .maybeSingle()
  if (!booking || !branchIds.includes(booking.branch_id)) {
    return { ok: false, message: 'Reservation not found or not authorized.' }
  }
  if (booking.status !== 'pending') return { ok: false, message: 'Only pending requests can receive a time suggestion.' }
  if (booking.time_slot === suggestedTime) return { ok: false, message: 'Choose a different time from the current request.' }

  const { error } = await supabase
    .from('reservations')
    .update({ suggested_time: suggestedTime })
    .eq('id', idCheck.data)
    .eq('status', 'pending')
  if (error) {
    logActionError('suggestReservationTime', error)
    return defaultErrorState
  }
  revalidatePath('/dashboard/restaurant/reservations')
  revalidatePath('/settings')
  return { ok: true, message: `Suggested ${suggestedTime} to the guest.` }
}

export async function acceptSuggestedReservationTime(id: string): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(id)
  if (!idCheck.success) return { ok: false, message: 'Invalid reservation identifier.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please sign in to accept the suggested time.' }

  const { data: booking } = await supabase
    .from('reservations')
    .select('id')
    .eq('id', idCheck.data)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!booking) return { ok: false, message: 'Reservation not found.' }

  const { data: acceptedTime, error } = await supabase.rpc('accept_reservation_suggestion', {
    p_reservation_id: idCheck.data,
  })
  if (error) {
    const message = error.message
    if (message.includes('RESERVATION_SLOT_FULL')) return { ok: false, message: 'That time is now full. Contact the restaurant for another option.' }
    if (message.includes('SUGGESTION_NOT_FOUND')) return { ok: false, message: 'This time suggestion is no longer available.' }
    logActionError('acceptSuggestedReservationTime', error)
    return defaultErrorState
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard/restaurant/reservations')
  return { ok: true, message: `Reservation confirmed for ${acceptedTime}.` }
}

export async function updatePartnerProfile(formData: FormData): Promise<DashboardActionState> {
  const parsed = partnerProfileSchema.safeParse({
    fullName: readText(formData, 'fullName'),
    contactEmail: readText(formData, 'contactEmail'),
    phone: readText(formData, 'phone'),
    city: readText(formData, 'city'),
    accountName: readText(formData, 'accountName'),
    category: readText(formData, 'category'),
    address: readText(formData, 'address'),
    website: readText(formData, 'website'),
    description: readText(formData, 'description'),
    logoUrl: readText(formData, 'logoUrl'),
    coverUrl: readText(formData, 'coverUrl'),
    listingId: readText(formData, 'listingId'),
    listingName: readText(formData, 'listingName'),
    cuisine: readText(formData, 'cuisine'),
    neighborhood: readText(formData, 'neighborhood'),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business' && role !== 'event_organizer') {
    return { ok: false, message: 'Only business partners can edit this profile.' }
  }

  const values = parsed.data
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: values.fullName,
      email: values.contactEmail || null,
      phone: values.phone || null,
      city: values.city || null,
    })
    .eq('id', user.id)
  if (profileError) {
    logActionError('updatePartnerProfile.profile', profileError)
    return defaultErrorState
  }

  if (role === 'food_business') {
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (!business) return { ok: false, message: 'No linked business profile found.' }

    const { error } = await supabase.from('businesses').update({
      name: values.accountName,
      email: values.contactEmail || null,
      phone: values.phone || null,
      city: values.city || null,
      address: values.address || null,
      category: values.category || null,
      website: values.website || null,
      description: values.description || null,
      logo_url: values.logoUrl || null,
      cover_url: values.coverUrl || null,
    }).eq('id', business.id)
    if (error) {
      logActionError('updatePartnerProfile.business', error)
      return defaultErrorState
    }

    if (values.listingId) {
      if (values.listingName.trim().length < 2) {
        return { ok: false, message: 'Restaurant name must be at least 2 characters.' }
      }
      const { data: listing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', values.listingId)
        .eq('business_id', business.id)
        .maybeSingle()
      if (!listing) return { ok: false, message: 'Restaurant listing not found or not authorized.' }
      const { error: listingError } = await supabase.from('restaurants').update({
        name: values.listingName,
        cuisine: values.cuisine || null,
        area_label: values.neighborhood || null,
        city: values.city || null,
        description: values.description || null,
        logo_url: values.logoUrl || null,
        cover_url: values.coverUrl || null,
      }).eq('id', listing.id)
      if (listingError) {
        logActionError('updatePartnerProfile.listing', listingError)
        return defaultErrorState
      }
      revalidatePath(`/restaurants/${listing.id}`)
    }
    revalidatePath('/dashboard/restaurant')
    revalidatePath('/dashboard/restaurant/settings')
    revalidatePath('/dashboard/restaurant/listings')
    revalidatePath('/restaurants')
  } else {
    const { data: organizer } = await supabase
      .from('organizers')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    if (!organizer) return { ok: false, message: 'No linked organizer profile found.' }

    const { error } = await supabase.from('organizers').update({
      name: values.accountName,
      email: values.contactEmail || null,
      phone: values.phone || null,
      city: values.city || null,
      address: values.address || null,
      category: values.category || null,
      website: values.website || null,
      description: values.description || null,
      logo_url: values.logoUrl || null,
      cover_url: values.coverUrl || null,
    }).eq('id', organizer.id)
    if (error) {
      logActionError('updatePartnerProfile.organizer', error)
      return defaultErrorState
    }
    revalidatePath('/dashboard/organizer')
    revalidatePath('/dashboard/organizer/settings')
    revalidatePath(`/organizers/${organizer.id}`)
  }

  return { ok: true, message: 'Profile updated.' }
}

export async function importMenuItems(
  branchId: string,
  items: Array<{ name: string; description?: string; price: number; category: string }>,
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(branchId)
  if (!idCheck.success || !Array.isArray(items) || items.length < 1 || items.length > 100) {
    return { ok: false, message: 'Choose between 1 and 100 valid menu items.' }
  }
  const cleanItems: Array<{ name: string; description: string | null; price: number; category: string }> = []
  for (const item of items) {
    if (
      !item || typeof item.name !== 'string' || item.name.trim().length < 2 || item.name.trim().length > 120 ||
      typeof item.category !== 'string' || item.category.trim().length > 80 ||
      !Number.isFinite(item.price) || item.price < 0 || item.price > 1_000_000
    ) {
      return { ok: false, message: 'One or more menu items have an invalid name, category, or price.' }
    }
    cleanItems.push({
      name: item.name.trim(),
      description: typeof item.description === 'string' ? item.description.trim().slice(0, 500) || null : null,
      price: Math.round(item.price * 100) / 100,
      category: item.category.trim() || 'General',
    })
  }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') return { ok: false, message: 'Only restaurant partners can import menu items.' }

  const { data: branch } = await supabase
    .from('branches')
    .select('id, business_id, restaurant_id')
    .eq('id', idCheck.data)
    .maybeSingle()
  if (!branch) return { ok: false, message: 'Branch not found or not authorized.' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', branch.business_id)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'Branch not found or not authorized.' }

  if (!branch.restaurant_id) {
    return { ok: false, message: 'Assign this branch to a listing before importing menu items.' }
  }

  const { error } = await supabase.from('menu_items').insert(
    cleanItems.map((item) => ({ ...item, branch_id: branch.id, is_available: true })),
  )
  if (error) {
    logActionError('importMenuItems', error)
    return defaultErrorState
  }

  revalidatePath(`/dashboard/restaurant/listings/${branch.restaurant_id}`)
  revalidatePath(`/dashboard/restaurant/listings/${branch.restaurant_id}/branches`)
  revalidatePath('/restaurants')
  return { ok: true, message: `Imported ${cleanItems.length} menu items. Review availability in your menu.` }
}

/** Owner-scoped lookup so a branch action can revalidate its own listing tabs. */
async function getOwnedRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  listingId: string,
) {
  const { data } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', listingId)
    .eq('business_id', businessId)
    .maybeSingle()
  return data as { id: string } | null
}

/** The listing a branch belongs to, so its menu/branches tabs can revalidate. */
async function getOwnedRestaurantByBranch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  branchId: string,
) {
  const { data } = await supabase
    .from('branches')
    .select('restaurant_id')
    .eq('id', branchId)
    .eq('business_id', businessId)
    .maybeSingle()
  const listingId = (data as { restaurant_id: string | null } | null)?.restaurant_id
  if (!listingId) return null
  return { id: listingId }
}

export async function saveListingDetails(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can edit listings.' }
  }

  const idCheck = uuidSchema.safeParse(readText(formData, 'listingId'))
  if (!idCheck.success) return { ok: false, message: 'Invalid listing identifier.' }

  // The banner is set at creation and validated against our storage bucket
  // there, so an edit deliberately cannot swap it out.
  const parsed = restaurantListingInputSchema.safeParse({
    name: readText(formData, 'name'),
    cuisine: readText(formData, 'cuisine'),
    areaLabel: readText(formData, 'areaLabel'),
    city: readText(formData, 'city'),
    closingLabel: readText(formData, 'closingLabel'),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const listing = await getOwnedRestaurant(supabase, business.id, idCheck.data)
  if (!listing) return { ok: false, message: 'Listing not found or not authorized.' }

  const { name, cuisine, areaLabel, city, closingLabel } = parsed.data

  const { error } = await supabase
    .from('restaurants')
    .update({
      name,
      cuisine: cuisine || null,
      area_label: areaLabel || null,
      city,
      closing_label: closingLabel || null,
    })
    .eq('id', idCheck.data)
    .eq('business_id', business.id)

  if (error) {
    logActionError('saveListingDetails', error)
    return defaultErrorState
  }

  revalidatePath(`/dashboard/restaurant/listings/${idCheck.data}`)
  revalidatePath('/dashboard/restaurant/listings')
  revalidatePath(`/restaurants/${idCheck.data}`)
  revalidatePath('/restaurants')
  return { ok: true, message: 'Listing details saved.' }
}

export async function setListingActive(
  listingId: string,
  active: boolean
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(listingId)
  if (!idCheck.success) return { ok: false, message: 'Invalid listing identifier.' }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can publish listings.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const listing = await getOwnedRestaurant(supabase, business.id, idCheck.data)
  if (!listing) return { ok: false, message: 'Listing not found or not authorized.' }

  const { error } = await supabase
    .from('restaurants')
    .update({ is_active: active })
    .eq('id', idCheck.data)
    .eq('business_id', business.id)

  if (error) {
    logActionError('setListingActive', error)
    return defaultErrorState
  }

  revalidatePath(`/dashboard/restaurant/listings/${idCheck.data}`)
  revalidatePath('/dashboard/restaurant/listings')
  revalidatePath('/dashboard/restaurant')
  revalidatePath(`/restaurants/${idCheck.data}`)
  revalidatePath('/restaurants')
  return { ok: true, message: active ? 'Listing is live.' : 'Listing paused.' }
}

/**
 * Deletes a listing. Destructive and irreversible: the FK cascade takes its
 * branches, their booking configs, and their menu items with it, so the caller
 * must confirm and the button states the consequence before it is pressed.
 */
export async function removeListing(
  listingId: string
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(listingId)
  if (!idCheck.success) return { ok: false, message: 'Invalid listing identifier.' }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can remove listings.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const listing = await getOwnedRestaurant(supabase, business.id, idCheck.data)
  if (!listing) return { ok: false, message: 'Listing not found or not authorized.' }

  const { data: branches } = await supabase
    .from('branches')
    .select('id')
    .eq('business_id', business.id)
    .eq('restaurant_id', idCheck.data)
  const branchCount = (branches ?? []).length

  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', idCheck.data)
    .eq('business_id', business.id)

  if (error) {
    logActionError('removeListing', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/restaurant/listings')
  revalidatePath('/dashboard/restaurant')
  revalidatePath(`/restaurants/${idCheck.data}`)
  revalidatePath('/restaurants')
  return {
    ok: true,
    message: branchCount
      ? `Listing removed, along with ${branchCount} branch${branchCount === 1 ? '' : 'es'} and their menus.`
      : 'Listing removed.',
  }
}

export async function toggleEventActive(
  id: string,
  active: boolean
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(id)
  if (!idCheck.success) return { ok: false, message: 'Invalid event identifier.' }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'event_organizer') {
    return { ok: false, message: 'Only organizers can manage events.' }
  }

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!organizer) return { ok: false, message: 'No linked organizer profile found.' }

  const { data: ev } = await supabase
    .from('events')
    .select('id')
    .eq('id', idCheck.data)
    .eq('organizer_id', organizer.id)
    .maybeSingle()
  if (!ev) return { ok: false, message: 'Event not found or not authorized.' }

  const { error } = await supabase
    .from('events')
    .update({ is_active: active, status: active ? 'published' : 'draft' })
    .eq('id', idCheck.data)

  if (error) {
    logActionError('toggleEventActive', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/organizer/events')
  revalidatePath('/events')
  revalidateTag('event-catalogue')
  return { ok: true, message: active ? 'Event published.' : 'Event unpublished.' }
}

export async function addBranch(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only food business accounts can add branches.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const restaurantCheck = uuidSchema.safeParse(readText(formData, 'restaurantId'))
  if (!restaurantCheck.success) return { ok: false, message: 'Choose a restaurant listing for this branch.' }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantCheck.data)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!restaurant) return { ok: false, message: 'Restaurant listing not found or not authorized.' }

  const parsed = branchInputSchema.safeParse({
    branchName: readText(formData, 'branchName'),
    address: readText(formData, 'address'),
    phone: readText(formData, 'phone'),
    latitude: blankToNull(formData.get('latitude')),
    longitude: blankToNull(formData.get('longitude')),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { branchName, address, phone, latitude, longitude } = parsed.data

  const { data: branch, error } = await supabase
    .from('branches')
    .insert({
      business_id: business.id,
      restaurant_id: restaurant.id,
      branch_name: branchName,
      address,
      phone: phone || null,
      latitude,
      longitude,
    })
    .select('id')
    .maybeSingle()

  if (error || !branch) {
    logActionError('addBranch', error ?? new Error('Branch insert returned no row'))
    // `42703` means the 0017 migration never landed on this project, so
    // `restaurant_id` does not exist. A generic "something went wrong" left the
    // partner with no way to act on it.
    if ((error as { code?: string } | null)?.code === '42703') {
      return {
        ok: false,
        message:
          'This project is missing the listing_id column on branches. Apply migration 0017_restaurant_listing_branches.sql, then try again.',
      }
    }
    return defaultErrorState
  }

  const { error: configError } = await supabase.from('booking_configs').insert({
    branch_id: branch.id,
    booking_mode: 'instant',
    total_tables: 10,
    max_guest_per_table: 8,
    slot_duration_minutes: 30,
    advance_notice_hours: 2,
  })
  if (configError) logActionError('addBranch.config', configError)

  revalidatePath('/dashboard/restaurant/listings')
  revalidatePath(`/dashboard/restaurant/listings/${restaurant.id}`)
  revalidatePath(`/dashboard/restaurant/listings/${restaurant.id}/branches`)
  revalidatePath('/restaurants')
  return { ok: true, message: `Branch "${branchName}" added.` }
}

export async function assignBranchToListing(
  branchId: string,
  restaurantId: string
): Promise<DashboardActionState> {
  const branchCheck = uuidSchema.safeParse(branchId)
  const restaurantCheck = uuidSchema.safeParse(restaurantId)
  if (!branchCheck.success || !restaurantCheck.success) {
    return { ok: false, message: 'Choose a valid branch and restaurant listing.' }
  }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') return { ok: false, message: 'Only restaurant partners can assign branches.' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: branch } = await supabase
    .from('branches')
    .select('id, restaurant_id')
    .eq('id', branchCheck.data)
    .eq('business_id', business.id)
    .is('restaurant_id', null)
    .maybeSingle()
  if (!branch) return { ok: false, message: 'Branch not found, already assigned, or not authorized.' }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', restaurantCheck.data)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!restaurant) return { ok: false, message: 'Restaurant listing not found or not authorized.' }

  const { error } = await supabase
    .from('branches')
    .update({ restaurant_id: restaurant.id })
    .eq('id', branch.id)
    .eq('business_id', business.id)
    .is('restaurant_id', null)

  if (error) {
    logActionError('assignBranchToListing', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/restaurant/listings')
  revalidatePath(`/dashboard/restaurant/listings/${restaurant.id}`)
  revalidatePath(`/dashboard/restaurant/listings/${restaurant.id}/branches`)
  revalidatePath('/restaurants')
  return { ok: true, message: 'Branch assigned to listing.' }
}

/**
 * Pausing is the reversible counterpart to deleting: the location stays in the
 * console with its menu and settings intact, but drops off the public listing
 * and stops being reservable.
 */
export async function setBranchActive(
  branchId: string,
  active: boolean
): Promise<DashboardActionState> {
  const branchCheck = uuidSchema.safeParse(branchId)
  if (!branchCheck.success) return { ok: false, message: 'Invalid location identifier.' }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can pause locations.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: branch } = await supabase
    .from('branches')
    .select('id, restaurant_id')
    .eq('id', branchCheck.data)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!branch) return { ok: false, message: 'Location not found or not authorized.' }

  const { error } = await supabase
    .from('branches')
    .update({ is_active: active })
    .eq('id', branch.id)
    .eq('business_id', business.id)

  if (error) {
    logActionError('setBranchActive', error)
    // 42703: migration 0018 (is_active) has not been applied to this project.
    if ((error as { code?: string }).code === '42703') {
      return {
        ok: false,
        message:
          'Pausing a location needs the is_active column. Apply migration 0018_branch_lifecycle.sql, then try again.',
      }
    }
    return defaultErrorState
  }

  const listingId = branch.restaurant_id
  revalidatePath('/dashboard/restaurant/listings')
  if (listingId) {
    revalidatePath(`/dashboard/restaurant/listings/${listingId}`)
    revalidatePath(`/dashboard/restaurant/listings/${listingId}/branches`)
  }
  revalidatePath(`/restaurants/${listingId ?? ''}`)
  revalidatePath('/restaurants')
  return {
    ok: true,
    message: active
      ? 'Location is live again and bookable.'
      : 'Location paused. Its menu and settings are kept.',
  }
}

/**
 * Irreversible. The FK cascade removes this branch's booking config and every
 * menu item under it, so the caller confirms with the counts in hand.
 */
export async function removeBranch(branchId: string): Promise<DashboardActionState> {
  const branchCheck = uuidSchema.safeParse(branchId)
  if (!branchCheck.success) return { ok: false, message: 'Invalid location identifier.' }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can remove locations.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: branch } = await supabase
    .from('branches')
    .select('id, branch_name, restaurant_id')
    .eq('id', branchCheck.data)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!branch) return { ok: false, message: 'Location not found or not authorized.' }

  // Count first: the confirm dialog needs the real number, not a guess.
  const { count: dishCount } = await supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('branch_id', branch.id)

  const { count: reservationCount } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('branch_id', branch.id)

  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', branch.id)
    .eq('business_id', business.id)

  if (error) {
    logActionError('removeBranch', error)
    return defaultErrorState
  }

  const listingId = branch.restaurant_id
  revalidatePath('/dashboard/restaurant/listings')
  if (listingId) {
    revalidatePath(`/dashboard/restaurant/listings/${listingId}`)
    revalidatePath(`/dashboard/restaurant/listings/${listingId}/branches`)
  }
  revalidatePath('/dashboard/restaurant')
  revalidatePath(`/restaurants/${listingId ?? ''}`)
  revalidatePath('/restaurants')

  const dishes = dishCount ?? 0
  const reservations = reservationCount ?? 0
  const lost: string[] = []
  if (dishes > 0) lost.push(`${dishes} menu item${dishes === 1 ? '' : 's'}`)
  if (reservations > 0) {
    lost.push(`${reservations} reservation${reservations === 1 ? '' : 's'}`)
  }
  return {
    ok: true,
    message: lost.length
      ? `Location removed, along with its ${lost.join(' and ')}.`
      : 'Location removed.',
  }
}

export async function updateBranchBookingConfig(input: {
  branchId: string
  bookingMode: string
  totalTables: number
  maxGuestPerTable: number
  slotDurationMinutes: number
  advanceNoticeHours: number
  cancellationPolicy?: string
}): Promise<DashboardActionState> {
  const parsed = bookingConfigInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can update availability.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('id', parsed.data.branchId)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!branch) return { ok: false, message: 'Branch not found or not authorized.' }

  // `branch_id` is the conflict target, not the default primary key. Without
  // it PostgREST resolves on `id`, which is absent from the payload — so
  // Postgres generated a new id per call and every save hit the unique
  // constraint on branch_id (23505). One config row per branch, upserted.
  const { error } = await supabase
    .from('booking_configs')
    .upsert(
      {
        branch_id: parsed.data.branchId,
        booking_mode: parsed.data.bookingMode,
        total_tables: parsed.data.totalTables,
        max_guest_per_table: parsed.data.maxGuestPerTable,
        slot_duration_minutes: parsed.data.slotDurationMinutes,
        advance_notice_hours: parsed.data.advanceNoticeHours,
        ...(parsed.data.cancellationPolicy !== undefined
          ? { cancellation_policy: parsed.data.cancellationPolicy }
          : {}),
      },
      { onConflict: 'branch_id' },
    )

  if (error) {
    logActionError('updateBranchBookingConfig', error)
    return {
      ok: false,
      message:
        (error as { code?: string }).code === '23505'
          ? 'This branch already has an availability record. Refresh the page and try saving again.'
          : defaultErrorState.message,
    }
  }

  const listing = await getOwnedRestaurantByBranch(supabase, business.id, parsed.data.branchId)

  revalidatePath(`/dashboard/restaurant/listings/${listing?.id ?? ''}`)
  revalidatePath(`/dashboard/restaurant/listings/${listing?.id ?? ''}/branches`)
  revalidatePath('/restaurants')
  return { ok: true, message: 'Availability settings saved.' }
}

export async function updateRestaurantHours(input: {
  restaurantId: string
  openingHours: Record<string, { open: string; close: string }[]>
}): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(input.restaurantId)
  if (!idCheck.success) return { ok: false, message: 'Invalid restaurant identifier.' }

  const hoursCheck = openingHoursSchema.safeParse(input.openingHours)
  if (!hoursCheck.success) return { ok: false, message: 'Opening hours format is invalid.' }

  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only restaurant partners can update hours.' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return { ok: false, message: 'No linked business profile found.' }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', idCheck.data)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!restaurant) return { ok: false, message: 'Restaurant not found or not authorized.' }

  const { error } = await supabase
    .from('restaurants')
    .update({ opening_hours: hoursCheck.data })
    .eq('id', idCheck.data)

  if (error) {
    logActionError('updateRestaurantHours', error)
    return defaultErrorState
  }

  revalidatePath(`/dashboard/restaurant/listings/${idCheck.data}`)
  revalidatePath(`/dashboard/restaurant/listings/${idCheck.data}/branches`)
  revalidatePath('/restaurants')
  return { ok: true, message: 'Opening hours saved.' }
}

export async function setBusinessVerification(
  businessId: string,
  approve: boolean
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(businessId)
  if (!idCheck.success) return { ok: false, message: 'Invalid business identifier.' }

  const { supabase, user, error: guardError } = await requireSystemAdmin()
  if (guardError || !user) return { ok: false, message: guardError ?? 'Not allowed.' }

  const expectedStatus = approve ? 'active' : 'rejected'
  const { data: updatedBusiness, error } = await supabase
    .from('businesses')
    .update({ status: expectedStatus, is_verified: approve })
    .eq('id', idCheck.data)
    .select('id, status')
    .maybeSingle()

  if (error) {
    logActionError('setBusinessVerification', error)
    return { ok: false, message: `Business verification failed (${error.code}): ${error.message}` }
  }
  if (!updatedBusiness) {
    return { ok: false, message: 'Business was not updated. Check that it exists and you have permission.' }
  }
  if (updatedBusiness.status !== expectedStatus) {
    return { ok: false, message: `Database kept this business at “${updatedBusiness.status}” instead of “${expectedStatus}”.` }
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: approve ? 'business_verification_approved' : 'business_verification_rejected',
    entity_type: 'business',
    entity_id: idCheck.data,
    metadata: { status: approve ? 'active' : 'rejected' },
  })
  if (auditError) logActionError('setBusinessVerification.audit', auditError)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/businesses')
  revalidatePath(`/dashboard/admin/businesses/${idCheck.data}`)
  revalidateTag('restaurant-catalogue')
  return { ok: true, message: approve ? 'Business verified.' : 'Business rejected.' }
}

// â”€â”€ Platform admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function requireSystemAdmin() {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { supabase, error: 'Please sign in again to continue.' as const }
  if (role !== 'system_admin') return { supabase, error: 'Only platform admins can do this.' as const }
  return { supabase, user }
}

export async function adminSetUserRole(
  userId: string,
  newRole: string
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(userId)
  const roleCheck = userRoleSchema.safeParse(newRole)
  if (!idCheck.success || !roleCheck.success) {
    return { ok: false, message: 'Invalid user or role.' }
  }

  const { supabase, user, error } = await requireSystemAdmin()
  if (error || !user) return { ok: false, message: error ?? 'Not allowed.' }
  if (user.id === userId) {
    return { ok: false, message: 'You cannot change your own role.' }
  }

  // Audited SECURITY DEFINER function — profiles RLS stays own-row for updates.
  const { error: rpcError } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_new_role: roleCheck.data,
  })
  if (rpcError) {
    logActionError('adminSetUserRole', rpcError)
    return defaultErrorState
  }

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin')
  return { ok: true, message: `Role updated to ${roleCheck.data}.` }
}

export async function adminSetUserSuspended(
  userId: string,
  suspended: boolean
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(userId)
  if (!idCheck.success) return { ok: false, message: 'Invalid user identifier.' }

  const { supabase, user, error } = await requireSystemAdmin()
  if (error || !user) return { ok: false, message: error ?? 'Not allowed.' }
  if (user.id === userId) {
    return { ok: false, message: 'You cannot suspend your own account.' }
  }

  // Refuse to touch other system_admins — a locked-out admin panel is worse than none.
  const { data: target } = await supabase
    .from('profiles')
    .select('role, is_suspended')
    .eq('id', userId)
    .maybeSingle()
  if (!target) return { ok: false, message: 'User not found.' }
  if ((target.role as string) === 'system_admin') {
    return { ok: false, message: 'System admins cannot be suspended from the panel.' }
  }
  if (Boolean(target.is_suspended) === suspended) {
    return { ok: true, message: suspended ? 'Already suspended.' : 'Not suspended.' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_suspended: suspended })
    .eq('id', userId)
  if (updateError) {
    logActionError('adminSetUserSuspended', updateError)
    return defaultErrorState
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: suspended ? 'user_suspended' : 'user_reinstated',
    entity_type: 'profile',
    entity_id: userId,
    metadata: {},
  })
  if (auditError) logActionError('adminSetUserSuspended.audit', auditError)

  revalidatePath('/dashboard/admin/users')
  revalidateTag('restaurant-catalogue')
  revalidateTag('event-catalogue')
  return { ok: true, message: suspended ? 'Account suspended.' : 'Account reinstated.' }
}

export async function adminVerifyOrganizer(
  organizerId: string,
  approve: boolean
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(organizerId)
  if (!idCheck.success) return { ok: false, message: 'Invalid organizer identifier.' }

  const { supabase, user, error: guardError } = await requireSystemAdmin()
  if (guardError || !user) return { ok: false, message: guardError ?? 'Not allowed.' }

  const { error } = await supabase
    .from('organizers')
    .update({ status: approve ? 'active' : 'rejected', is_verified: approve })
    .eq('id', idCheck.data)

  if (error) {
    logActionError('adminVerifyOrganizer', error)
    return defaultErrorState
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: approve ? 'organizer_verification_approved' : 'organizer_verification_rejected',
    entity_type: 'organizer',
    entity_id: idCheck.data,
    metadata: { status: approve ? 'active' : 'rejected' },
  })
  if (auditError) logActionError('adminVerifyOrganizer.audit', auditError)

  revalidatePath('/dashboard/admin/organizers')
  revalidateTag('event-catalogue')
  return { ok: true, message: approve ? 'Organizer verified.' : 'Organizer rejected.' }
}

export async function adminModerateEvent(
  eventId: string,
  action: string
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(eventId)
  const actionCheck = eventModerationActionSchema.safeParse(action)
  if (!idCheck.success || !actionCheck.success) {
    return { ok: false, message: 'Invalid event or moderation action.' }
  }

  const { supabase, user, error: guardError } = await requireSystemAdmin()
  if (guardError || !user) return { ok: false, message: guardError ?? 'Not allowed.' }

  const patch =
    actionCheck.data === 'publish'
      ? { status: 'published' as const, is_active: true }
      : actionCheck.data === 'unpublish'
        ? { status: 'draft' as const, is_active: false }
        : { status: 'cancelled' as const, is_active: false }

  const { error } = await supabase.from('events').update(patch).eq('id', idCheck.data)
  if (error) {
    logActionError('adminModerateEvent', error)
    return defaultErrorState
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: `event_moderation_${actionCheck.data}`,
    entity_type: 'event',
    entity_id: idCheck.data,
    metadata: { status: patch.status },
  })
  if (auditError) logActionError('adminModerateEvent.audit', auditError)

  revalidatePath('/dashboard/admin/events')
  revalidatePath('/events')
  revalidateTag('event-catalogue')
  return { ok: true, message: `Event ${actionCheck.data === 'publish' ? 'published' : actionCheck.data + 'ed'}.` }
}

export async function adminCancelReservation(
  reservationId: string
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(reservationId)
  if (!idCheck.success) return { ok: false, message: 'Invalid reservation identifier.' }

  const { supabase, user, error: guardError } = await requireSystemAdmin()
  if (guardError || !user) return { ok: false, message: guardError ?? 'Not allowed.' }

  const { data: existing } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', idCheck.data)
    .maybeSingle()
  if (!existing) return { ok: false, message: 'Reservation not found.' }
  if (existing.status !== 'pending' && existing.status !== 'confirmed') {
    return { ok: false, message: `Cannot cancel a ${existing.status} reservation.` }
  }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', idCheck.data)
  if (error) {
    logActionError('adminCancelReservation', error)
    return defaultErrorState
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'reservation_cancelled_by_admin',
    entity_type: 'reservation',
    entity_id: idCheck.data,
    metadata: { previous_status: existing.status },
  })
  if (auditError) logActionError('adminCancelReservation.audit', auditError)

  revalidatePath('/dashboard/admin/reservations')
  return { ok: true, message: 'Reservation cancelled.' }
}

export async function adminSetBusinessActive(
  businessId: string,
  active: boolean
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(businessId)
  if (!idCheck.success) return { ok: false, message: 'Invalid business identifier.' }

  const { supabase, user, error: guardError } = await requireSystemAdmin()
  if (guardError || !user) return { ok: false, message: guardError ?? 'Not allowed.' }

  // moderation_status has no 'suspended' value; suspension = 'inactive'.
  const expectedStatus = active ? 'active' : 'inactive'
  const { data: updatedBusiness, error } = await supabase
    .from('businesses')
    .update({ status: expectedStatus })
    .eq('id', idCheck.data)
    .select('id, status')
    .maybeSingle()

  if (error) {
    logActionError('adminSetBusinessActive', error)
    return { ok: false, message: `Business status update failed (${error.code}): ${error.message}` }
  }
  if (!updatedBusiness) {
    return { ok: false, message: 'Business was not updated. Check that it exists and you have permission.' }
  }
  if (updatedBusiness.status !== expectedStatus) {
    return { ok: false, message: `Database kept this business at “${updatedBusiness.status}” instead of “${expectedStatus}”.` }
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: active ? 'business_reactivated' : 'business_suspended',
    entity_type: 'business',
    entity_id: idCheck.data,
    metadata: { status: active ? 'active' : 'inactive' },
  })
  if (auditError) logActionError('adminSetBusinessActive.audit', auditError)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/businesses')
  revalidatePath(`/dashboard/admin/businesses/${businessId}`)
  revalidateTag('restaurant-catalogue')
  return { ok: true, message: active ? 'Business reactivated.' : 'Business suspended.' }
}

// ── Verification workflow ───────────────────────────────────────────────

/**
 * Resolve the partner record a verification request applies to.
 *
 * Ordered + limited rather than `.maybeSingle()` for the same reason
 * getOrganizerAccount does it: a layout and a page can self-heal concurrently
 * and create duplicates, which would make `maybeSingle()` error and look like a
 * missing profile. Oldest wins, matching the 0015 dedupe.
 */
async function resolvePartnerEntity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  entityType: 'business' | 'organizer',
) {
  const table = entityType === 'business' ? 'businesses' : 'organizers'
  const { data } = await supabase
    .from(table)
    .select('id, name, status, is_verified')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
  return (data?.[0] ?? null) as
    | { id: string; name: string; status: string | null; is_verified: boolean | null }
    | null
}

/**
 * A partner asks to be verified.
 *
 * This is the step that was missing: before, the only way out of the
 * pending/unverified defaults was an admin happening to spot the row in a list.
 * `ensureBusiness` / `ensureOrganizer` insert neither `status` nor
 * `is_verified`, so without this a partner's listings are invisible on every
 * public surface and they have no way to ask or to find out they are waiting.
 */
export async function submitVerificationRequest(
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }

  const entityType = readText(formData, 'entityType')
  const expectedRole = entityType === 'business' ? 'food_business' : 'event_organizer'
  if (role !== expectedRole) {
    return { ok: false, message: 'Only partner accounts can request verification.' }
  }

  const parsed = verificationRequestSchema.safeParse({
    entityType,
    legalName: readText(formData, 'legalName'),
    registrationNumber: readText(formData, 'registrationNumber'),
    taxId: readText(formData, 'taxId'),
    phone: readText(formData, 'phone'),
    address: readText(formData, 'address'),
    city: readText(formData, 'city'),
    website: readText(formData, 'website'),
    note: readText(formData, 'note'),
    documents: parseDocumentJson(readText(formData, 'documents')),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const entity = await resolvePartnerEntity(supabase, user.id, parsed.data.entityType)
  if (!entity) {
    return { ok: false, message: 'No linked partner profile found. Complete your profile first.' }
  }

  if (entity.is_verified === true) {
    return { ok: true, message: 'Your account is already verified.' }
  }

  // An open request already exists (ux_verification_requests_open). Updating it
  // keeps one row per attempt instead of filling the queue with duplicates.
  const { data: openRows } = await supabase
    .from('verification_requests')
    .select('id')
    .eq('entity_type', parsed.data.entityType)
    .eq('entity_id', entity.id)
    .in('status', ['pending', 'in_review', 'needs_info'])
    .order('submitted_at', { ascending: true })
    .limit(1)

  const openId = (openRows?.[0] as { id?: string } | undefined)?.id

  // The storage path is a bare object path, and the admin review screen turns it
  // into a signed URL. Without this check a crafted request could make the
  // server sign any object in the bucket, not just the uploader's own folder.
  const ownPrefix = `${user.id}/`
  const foreignDoc = parsed.data.documents.find((d) => !d.path.startsWith(ownPrefix))
  if (foreignDoc) {
    return { ok: false, message: 'One of the documents was not uploaded from your account.' }
  }

  const payload = {
    entity_type: parsed.data.entityType,
    entity_id: entity.id,
    owner_id: user.id,
    legal_name: parsed.data.legalName,
    registration_number: parsed.data.registrationNumber || null,
    tax_id: parsed.data.taxId || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    website: parsed.data.website || null,
    note: parsed.data.note || null,
    documents: parsed.data.documents,
    status: 'pending' as const,
    // A resubmission goes back to the front of the queue rather than inheriting
    // a stale 'in_review' nobody is working.
    reviewer_id: null,
    reviewer_note: null,
    decided_at: null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = openId
    ? await supabase.from('verification_requests').update(payload).eq('id', openId)
    : await supabase.from('verification_requests').insert(payload)

  if (error) {
    logActionError('submitVerificationRequest', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/organizer/settings')
  revalidatePath('/dashboard/restaurant/settings')
  revalidatePath('/dashboard/admin/verification')
  return {
    ok: true,
    message: 'Verification request submitted. We will review it and notify you either way.',
  }
}

/**
 * An admin works one queued request.
 *
 * Approving is what makes a partner public: private.business_is_public /
 * private.organizer_is_public require status = 'active' AND is_verified = true
 * together, so setting only one leaves the partner invisible with no way to
 * tell why. The read-back mirrors setBusinessVerification, which checks the
 * database actually took the update rather than trusting a silent no-op.
 */
export async function reviewVerificationRequest(
  requestId: string,
  decision: string,
  reviewerNote: string
): Promise<DashboardActionState> {
  const idCheck = uuidSchema.safeParse(requestId)
  const decisionCheck = verificationDecisionSchema.safeParse(decision)
  if (!idCheck.success || !decisionCheck.success) {
    return { ok: false, message: 'Invalid request or decision.' }
  }

  const { supabase, user, error: guardError } = await requireSystemAdmin()
  if (guardError || !user) return { ok: false, message: guardError ?? 'Not allowed.' }

  const note = reviewerNote.trim()
  if (decisionCheck.data !== 'start_review' && !note) {
    return { ok: false, message: 'Add a short note so the partner knows what happened.' }
  }

  const { data: existing } = await supabase
    .from('verification_requests')
    .select('id, entity_type, entity_id, status')
    .eq('id', idCheck.data)
    .maybeSingle()

  const current = existing as
    | { id: string; entity_type: 'business' | 'organizer'; entity_id: string; status: string }
    | null
  if (!current) return { ok: false, message: 'That request no longer exists.' }

  if (
    decisionCheck.data !== 'start_review' &&
    !['pending', 'in_review', 'needs_info'].includes(current.status)
  ) {
    return { ok: false, message: `This request was already ${current.status}.` }
  }

  const nextStatus =
    decisionCheck.data === 'start_review'
      ? 'in_review'
      : decisionCheck.data === 'approve'
        ? 'approved'
        : decisionCheck.data === 'reject'
          ? 'rejected'
          : 'needs_info'

  const { data: updated, error } = await supabase
    .from('verification_requests')
    .update({
      status: nextStatus,
      reviewer_id: user.id,
      reviewer_note: note || null,
      decided_at: nextStatus === 'in_review' ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', idCheck.data)
    .select('status')
    .maybeSingle()

  if (error) {
    logActionError('reviewVerificationRequest', error)
    return defaultErrorState
  }
  if (!updated || (updated as { status?: string }).status !== nextStatus) {
    return {
      ok: false,
      message: `The database kept this request at “${(updated as { status?: string } | null)?.status ?? 'unknown'}”.`,
    }
  }

  // Approval is what flips the partner to public. Both columns, together.
  if (nextStatus === 'approved') {
    const table = current.entity_type === 'business' ? 'businesses' : 'organizers'
    const { data: entity, error: entityError } = await supabase
      .from(table)
      .update({ status: 'active', is_verified: true, updated_at: new Date().toISOString() })
      .eq('id', current.entity_id)
      .select('id, status, is_verified')
      .maybeSingle()

    if (entityError || !entity) {
      logActionError('reviewVerificationRequest.entity', entityError ?? new Error('entity not updated'))
      return {
        ok: false,
        message: 'The request was approved but the partner record could not be updated. Reopen and retry.',
      }
    }
  }

  const { error: auditError } = await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: `verification_${nextStatus}`,
    entity_type: current.entity_type,
    entity_id: current.entity_id,
    metadata: { request_id: idCheck.data, note: note || null },
  })
  if (auditError) logActionError('reviewVerificationRequest.audit', auditError)

  revalidatePath('/dashboard/admin/verification')
  revalidatePath(`/dashboard/admin/verification/${idCheck.data}`)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/organizers')
  revalidatePath('/dashboard/admin/businesses')
  revalidatePath('/dashboard/organizer/settings')
  revalidatePath('/dashboard/restaurant/settings')
  // Approval changes what the public catalogue can see, so both caches must go.
  revalidateTag('restaurant-catalogue')
  revalidateTag('event-catalogue')

  const messages: Record<string, string> = {
    in_review: 'Marked as in review. The partner has been notified.',
    approved: 'Approved. Their listings are now visible on UrbanExplore.',
    rejected: 'Declined. The partner has been notified with your note.',
    needs_info: 'Marked as needing more information. The partner has been notified.',
  }
  return { ok: true, message: messages[nextStatus] ?? 'Request updated.' }
}

/** Parse the hidden documents field, which arrives as a JSON string. */
function parseDocumentJson(raw: string): unknown {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}
