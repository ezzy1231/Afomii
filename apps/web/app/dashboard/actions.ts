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
