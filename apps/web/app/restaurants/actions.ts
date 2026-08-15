'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ReservationActionState = {
  ok: boolean
  message: string
  id?: string
  status?: string
}

export async function createReservation(input: {
  branchId: string
  reservationDate: string
  timeSlot: string
  guestCount: number
}): Promise<ReservationActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Please sign in to make a reservation.' }

  if (!input.branchId || !input.reservationDate || !input.timeSlot || input.guestCount < 1) {
    return { ok: false, message: 'Please complete all reservation details.' }
  }

  const { data, error } = await supabase.rpc('reserve_table', {
    p_branch_id: input.branchId,
    p_reservation_date: input.reservationDate,
    p_time_slot: input.timeSlot,
    p_guest_count: input.guestCount,
    p_user_id: user.id,
  })

  if (error) {
    const msg = error.message
    if (msg.includes('RESERVATION_SLOT_FULL')) {
      return { ok: false, message: 'That time slot is fully booked. Please choose another time.' }
    }
    if (msg.includes('BRANCH_NOT_CONFIGURED')) {
      return { ok: false, message: 'This branch is not accepting reservations yet.' }
    }
    return { ok: false, message: 'Could not complete your reservation. Please try again.' }
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', data)
    .maybeSingle()

  const status = (reservation?.status as string) ?? 'pending'
  revalidatePath('/settings')
  revalidatePath('/dashboard/restaurant/reservations')

  return {
    ok: true,
    id: data as string,
    status,
    message:
      status === 'confirmed'
        ? 'Reservation confirmed. See you soon!'
        : 'Reservation requested. Awaiting restaurant confirmation.',
  }
}

export async function cancelReservation(id: string): Promise<ReservationActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Please sign in.' }

  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error || !data) return { ok: false, message: 'Could not cancel this reservation.' }

  revalidatePath('/settings')
  revalidatePath('/dashboard/restaurant/reservations')
  return { ok: true, message: 'Reservation cancelled.' }
}
