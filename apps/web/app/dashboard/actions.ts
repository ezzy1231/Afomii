'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type DashboardActionState = {
  ok: boolean
  message: string
}

const defaultErrorState: DashboardActionState = {
  ok: false,
  message: 'Something went wrong. Please try again.',
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function getCurrentUserRole() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, role: null as string | null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return { supabase, user, role: (profile?.role as string | undefined) ?? null }
}

export async function createRestaurantListing(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'food_business') {
    return { ok: false, message: 'Only food business accounts can create restaurant listings.' }
  }

  const name = readText(formData, 'name')
  const cuisine = readText(formData, 'cuisine')
  const areaLabel = readText(formData, 'areaLabel')
  const city = readText(formData, 'city')
  const closingLabel = readText(formData, 'closingLabel')

  if (!name) return { ok: false, message: 'Restaurant name is required.' }
  if (name.length < 2) return { ok: false, message: 'Restaurant name must be at least 2 characters.' }
  if (!city) return { ok: false, message: 'City is required.' }

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

  const { error } = await supabase.from('restaurants').insert({
    business_id: business.id,
    name,
    cuisine: cuisine || null,
    area_label: areaLabel || null,
    city,
    closing_label: closingLabel || null,
    is_active: true,
  })

  if (error) return defaultErrorState

  revalidatePath('/dashboard/restaurant')
  revalidatePath('/restaurants')

  return { ok: true, message: `Restaurant listing created for ${name}.` }
}

export async function createEventListing(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const { supabase, user, role } = await getCurrentUserRole()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (role !== 'event_organizer') {
    return { ok: false, message: 'Only event organizer accounts can create event listings.' }
  }

  const title = readText(formData, 'title')
  const category = readText(formData, 'category')
  const venueName = readText(formData, 'venueName')
  const startsAt = readText(formData, 'startsAt')
  const priceLabel = readText(formData, 'priceLabel')

  if (!title) return { ok: false, message: 'Event title is required.' }
  if (!venueName) return { ok: false, message: 'Venue is required.' }

  const startsAtDate = startsAt ? new Date(startsAt) : null
  if (startsAt && (!startsAtDate || Number.isNaN(startsAtDate.getTime()))) {
    return { ok: false, message: 'Please provide a valid date and time.' }
  }

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!organizer) {
    return {
      ok: false,
      message: 'No linked organizer profile found. Complete organizer signup first.',
    }
  }

  const { error } = await supabase.from('events').insert({
    organizer_id: organizer.id,
    title,
    category: category || null,
    venue_name: venueName,
    starts_at: startsAtDate ? startsAtDate.toISOString() : null,
    price_label: priceLabel || null,
    is_active: true,
  })

  if (error) return defaultErrorState

  revalidatePath('/dashboard/organizer')
  revalidatePath('/events')

  return { ok: true, message: `Event created: ${title}.` }
}

const RESERVATION_STATUSES = new Set([
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'completed',
])

export async function updateReservationStatus(
  id: string,
  status: string
): Promise<DashboardActionState> {
  if (!RESERVATION_STATUSES.has(status)) {
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
    .eq('id', id)
    .maybeSingle()
  if (!existing || !branchIds.includes(existing.branch_id)) {
    return { ok: false, message: 'Reservation not found or not authorized.' }
  }

  const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
  if (error) return defaultErrorState

  await supabase
    .from('audit_logs')
    .insert({
      actor_id: user.id,
      action: 'reservation_status_change',
      entity_type: 'reservation',
      entity_id: id,
      metadata: { status },
    })
    .then(() => {})

  revalidatePath('/dashboard/restaurant/reservations')
  return { ok: true, message: `Reservation marked ${status}.` }
}

const BOOKING_MODES = new Set(['instant', 'request', 'closed'])

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

  const branchName = readText(formData, 'branchName')
  const address = readText(formData, 'address')
  const phone = readText(formData, 'phone')
  const latRaw = formData.get('latitude')
  const lngRaw = formData.get('longitude')
  const latitude = typeof latRaw === 'string' && latRaw.trim() ? Number(latRaw) : null
  const longitude = typeof lngRaw === 'string' && lngRaw.trim() ? Number(lngRaw) : null

  if (!branchName || !address) {
    return { ok: false, message: 'Branch name and address are required.' }
  }

  const { data: branch, error } = await supabase
    .from('branches')
    .insert({
      business_id: business.id,
      branch_name: branchName,
      address,
      phone: phone || null,
      latitude,
      longitude,
    })
    .select('id')
    .maybeSingle()

  if (error || !branch) return defaultErrorState

  await supabase
    .from('booking_configs')
    .insert({
      branch_id: branch.id,
      booking_mode: 'instant',
      total_tables: 10,
      max_guest_per_table: 8,
      slot_duration_minutes: 30,
      advance_notice_hours: 2,
    })
    .then(() => {})

  revalidatePath('/dashboard/restaurant/branches')
  revalidatePath('/restaurants')
  return { ok: true, message: `Branch "${branchName}" added.` }
}

export async function updateBranchBookingConfig(input: {
  branchId: string
  bookingMode: string
  totalTables: number
  maxGuestPerTable: number
  slotDurationMinutes: number
  advanceNoticeHours: number
}): Promise<DashboardActionState> {
  if (!BOOKING_MODES.has(input.bookingMode)) {
    return { ok: false, message: 'Invalid booking mode.' }
  }

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
    .eq('id', input.branchId)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!branch) return { ok: false, message: 'Branch not found or not authorized.' }

  const { error } = await supabase.from('booking_configs').upsert({
    branch_id: input.branchId,
    booking_mode: input.bookingMode,
    total_tables: input.totalTables,
    max_guest_per_table: input.maxGuestPerTable,
    slot_duration_minutes: input.slotDurationMinutes,
    advance_notice_hours: input.advanceNoticeHours,
  })

  if (error) return defaultErrorState

  revalidatePath('/dashboard/restaurant/branches')
  revalidatePath('/restaurants')
  return { ok: true, message: 'Availability settings saved.' }
}

export async function updateRestaurantHours(input: {
  restaurantId: string
  openingHours: Record<string, { open: string; close: string }[]>
}): Promise<DashboardActionState> {
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
    .eq('id', input.restaurantId)
    .eq('business_id', business.id)
    .maybeSingle()
  if (!restaurant) return { ok: false, message: 'Restaurant not found or not authorized.' }

  const { error } = await supabase
    .from('restaurants')
    .update({ opening_hours: input.openingHours })
    .eq('id', input.restaurantId)

  if (error) return defaultErrorState

  revalidatePath('/dashboard/restaurant/branches')
  revalidatePath('/restaurants')
  return { ok: true, message: 'Opening hours saved.' }
}
