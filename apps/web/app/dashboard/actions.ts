'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  branchInputSchema,
  bookingConfigInputSchema,
  eventListingInputSchema,
  firstIssue,
  logActionError,
  openingHoursSchema,
  restaurantListingInputSchema,
  reservationStatusSchema,
  uuidSchema,
} from '@/lib/validation'

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

  const parsed = restaurantListingInputSchema.safeParse({
    name: readText(formData, 'name'),
    cuisine: readText(formData, 'cuisine'),
    areaLabel: readText(formData, 'areaLabel'),
    city: readText(formData, 'city'),
    closingLabel: readText(formData, 'closingLabel'),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { name, cuisine, areaLabel, city, closingLabel } = parsed.data

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

  if (error) {
    logActionError('createRestaurantListing', error)
    return defaultErrorState
  }

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

  const parsed = eventListingInputSchema.safeParse({
    title: readText(formData, 'title'),
    category: readText(formData, 'category'),
    venueName: readText(formData, 'venueName'),
    startsAt: readText(formData, 'startsAt'),
    priceLabel: readText(formData, 'priceLabel'),
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { title, category, venueName, startsAt, priceLabel } = parsed.data
  const startsAtDate = startsAt ? new Date(startsAt) : null

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

  if (error) {
    logActionError('createEventListing', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/organizer')
  revalidatePath('/events')

  return { ok: true, message: `Event created: ${title}.` }
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

  const latRaw = formData.get('latitude')
  const lngRaw = formData.get('longitude')
  const parsed = branchInputSchema.safeParse({
    branchName: readText(formData, 'branchName'),
    address: readText(formData, 'address'),
    phone: readText(formData, 'phone'),
    latitude: typeof latRaw === 'string' && latRaw.trim() ? latRaw : null,
    longitude: typeof lngRaw === 'string' && lngRaw.trim() ? lngRaw : null,
  })
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }

  const { branchName, address, phone, latitude, longitude } = parsed.data

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

  if (error || !branch) {
    logActionError('addBranch', error ?? new Error('Branch insert returned no row'))
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

  const { error } = await supabase.from('booking_configs').upsert({
    branch_id: parsed.data.branchId,
    booking_mode: parsed.data.bookingMode,
    total_tables: parsed.data.totalTables,
    max_guest_per_table: parsed.data.maxGuestPerTable,
    slot_duration_minutes: parsed.data.slotDurationMinutes,
    advance_notice_hours: parsed.data.advanceNoticeHours,
  })

  if (error) {
    logActionError('updateBranchBookingConfig', error)
    return defaultErrorState
  }

  revalidatePath('/dashboard/restaurant/branches')
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

  revalidatePath('/dashboard/restaurant/branches')
  revalidatePath('/restaurants')
  return { ok: true, message: 'Opening hours saved.' }
}
