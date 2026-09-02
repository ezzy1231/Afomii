'use server'

import { createClient } from '@/lib/supabase/server'
import { isRideBookable } from '@/lib/rideWindow'
import { logActionError } from '@/lib/validation'

export type PlanRideActionState = {
  ok: boolean
  message: string
  url?: string
}

/** Mark a notification (or all) as read. Returns the new unread count. */
export async function markNotificationsRead(id?: string): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
  if (id) query.eq('id', id)

  await query

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return count ?? 0
}

/**
 * Returns a pre-filled /ride URL for a plan's destination. Validates the
 * ride-booking window server-side so a forged client request cannot bypass it.
 */
export async function startPlanRide(
  planId: string,
  planType: 'reservation' | 'event',
): Promise<PlanRideActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please sign in first.' }

  try {
    let to: string
    let lat: number | null = null
    let lng: number | null = null
    let planDate: string | null = null

    if (planType === 'reservation') {
      const { data: reservation, error: rErr } = await supabase
        .from('reservations')
        .select('id, reservation_date, time_slot, branch_id, branch:branches!inner(branch_name, address, latitude, longitude, business_id)')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single()

      if (rErr || !reservation) {
        return { ok: false, message: 'Reservation not found.' }
      }

      const branch = Array.isArray(reservation.branch) ? reservation.branch[0] : reservation.branch
      const businessId = branch?.business_id ?? null

      // Fetch the restaurant name linked to the same business_id
      let restaurantName = branch?.branch_name ?? 'My reservation'
      if (businessId) {
        const { data: rest } = await supabase
          .from('restaurants')
          .select('name')
          .eq('business_id', businessId)
          .maybeSingle()
        if (rest?.name) restaurantName = rest.name
      }

      to = restaurantName
      lat = branch?.latitude ?? null
      lng = branch?.longitude ?? null

      // Build plan date from reservation_date + time_slot
      const datePart = (reservation as any).reservation_date
      const timePart = (reservation as any).time_slot
      if (datePart) {
        planDate = timePart ? `${datePart}T${timePart}:00` : `${datePart}T12:00:00`
      }
    } else {
      // event
      const { data: purchase, error: pErr } = await supabase
        .from('ticket_purchases')
        .select('id, event:events!inner(id, title, venue_name, latitude, longitude, starts_at)')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single()

      if (pErr || !purchase) {
        return { ok: false, message: 'Event ticket not found.' }
      }

      const ev = Array.isArray(purchase.event) ? purchase.event[0] : purchase.event
      to = ev?.title ?? 'My event'
      lat = ev?.latitude ?? null
      lng = ev?.longitude ?? null
      planDate = ev?.starts_at ?? null
    }

    // Server-side window check
    if (!isRideBookable(planDate)) {
      return {
        ok: false,
        message: 'Ride booking is only available within 3 hours of the plan start time.',
      }
    }

    const params = new URLSearchParams()
    params.set('to', to)
    if (lat != null && lng != null) {
      params.set('lat', String(lat))
      params.set('lng', String(lng))
    }
    params.set('plan', planId)

    return { ok: true, message: '', url: `/ride?${params.toString()}` }
  } catch (err) {
    logActionError('startPlanRide', err)
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
}
