'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { firstIssue, logActionError, reservationInputSchema, uuidSchema } from '@/lib/validation'

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

  const parsed = reservationInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }
  const { branchId, reservationDate, timeSlot, guestCount } = parsed.data

  const { data, error } = await supabase.rpc('reserve_table', {
    p_branch_id: branchId,
    p_reservation_date: reservationDate,
    p_time_slot: timeSlot,
    p_guest_count: guestCount,
  })

  if (error) {
    const msg = error.message
    logActionError('createReservation', msg)
    if (msg.includes('RESERVATION_SLOT_FULL')) {
      return { ok: false, message: 'That time slot is fully booked. Please choose another time.' }
    }
    if (msg.includes('PARTY_TOO_LARGE')) {
      return { ok: false, message: 'Your party size exceeds the maximum guests per table for this venue.' }
    }
    if (msg.includes('BRANCH_NOT_CONFIGURED')) {
      return { ok: false, message: 'This branch is not accepting reservations yet.' }
    }
    return { ok: false, message: 'Could not complete your reservation. Please try again.' }
  }

  const { data: reservation, error: fetchError } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', data)
    .maybeSingle()
  if (fetchError) logActionError('createReservation.fetch', fetchError)

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

  const idCheck = uuidSchema.safeParse(id)
  if (!idCheck.success) return { ok: false, message: 'Invalid reservation identifier.' }

  const { data, error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', idCheck.data)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    logActionError('cancelReservation', error ?? new Error('Reservation not found or not owned'))
    return { ok: false, message: 'Could not cancel this reservation.' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard/restaurant/reservations')
  return { ok: true, message: 'Reservation cancelled.' }
}
