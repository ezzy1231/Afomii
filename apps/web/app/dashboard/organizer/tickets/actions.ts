'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { firstIssue, logActionError, ticketTierInputSchema, uuidSchema } from '@/lib/validation'

export type TierActionState = {
  ok: boolean
  message: string
}

export type TicketTierInput = {
  id?: string
  eventId: string
  name: string
  tier: string
  price: number
  totalQuantity: number
  salesStart?: string | null
  salesEnd?: string | null
}

async function getOrganizerContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, organizerId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const isOrganizer = profile?.role === 'event_organizer' || Boolean(organizer)
  return { supabase, user, organizerId: isOrganizer ? (organizer?.id ?? null) : null }
}

function toIso(value?: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export async function saveTicketTier(input: TicketTierInput): Promise<TierActionState> {
  const parsed = ticketTierInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }
  const { eventId, name, tier, price, totalQuantity, salesStart, salesEnd, id } = parsed.data

  const { supabase, user, organizerId } = await getOrganizerContext()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (!organizerId) {
    return { ok: false, message: 'No linked organizer profile found. Complete organizer signup first.' }
  }

  // Event must belong to this organizer.
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .maybeSingle()
  if (!event) return { ok: false, message: 'Event not found or not authorized.' }

  const payload = {
    name,
    tier,
    price,
    sales_start: toIso(salesStart),
    sales_end: toIso(salesEnd),
  }

  if (id) {
    const { data: existing } = await supabase
      .from('ticket_types')
      .select('id, total_quantity, remaining_quantity, events(organizer_id)')
      .eq('id', id)
      .maybeSingle()
    if (!existing) return { ok: false, message: 'Tier not found or not authorized.' }

    const embedded = Array.isArray(existing.events) ? existing.events[0] : existing.events
    if ((embedded as any)?.organizer_id !== organizerId) {
      return { ok: false, message: 'Tier not found or not authorized.' }
    }

    // Preserve sold count: sold = total - remaining stays constant on resize.
    const sold = Math.max(0, existing.total_quantity - existing.remaining_quantity)
    const nextRemaining = Math.max(0, totalQuantity - sold)

    const { error } = await supabase
      .from('ticket_types')
      .update({ ...payload, total_quantity: totalQuantity, remaining_quantity: nextRemaining })
      .eq('id', existing.id)

    if (error) {
      logActionError('saveTicketTier.update', error)
      return { ok: false, message: 'Could not save changes. Please try again.' }
    }
  } else {
    const { error } = await supabase.from('ticket_types').insert({
      event_id: eventId,
      ...payload,
      total_quantity: totalQuantity,
      remaining_quantity: totalQuantity,
    })

    if (error) {
      logActionError('saveTicketTier.insert', error)
      return { ok: false, message: 'Could not create the tier. Please try again.' }
    }
  }

  revalidatePath('/dashboard/organizer/tickets')
  revalidatePath(`/events/${input.eventId}`)
  revalidatePath('/events')

  return { ok: true, message: input.id ? `"${name}" updated.` : `"${name}" added.` }
}

export async function deleteTicketTier(id: string): Promise<TierActionState> {
  const idCheck = uuidSchema.safeParse(id)
  if (!idCheck.success) return { ok: false, message: 'Invalid tier identifier.' }

  const { supabase, user, organizerId } = await getOrganizerContext()
  if (!user) return { ok: false, message: 'Please sign in again to continue.' }
  if (!organizerId) return { ok: false, message: 'No linked organizer profile found.' }

  const { data: tier } = await supabase
    .from('ticket_types')
    .select('id, name, event_id, events(organizer_id)')
    .eq('id', idCheck.data)
    .maybeSingle()

  if (!tier) return { ok: false, message: 'Tier not found or not authorized.' }
  const embedded = Array.isArray(tier.events) ? tier.events[0] : tier.events
  if ((embedded as any)?.organizer_id !== organizerId) {
    return { ok: false, message: 'Tier not found or not authorized.' }
  }

  const { count } = await supabase
    .from('ticket_purchases')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_type_id', id)

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: `"${tier.name}" already has sales and cannot be deleted. Set its quantity to cover existing tickets.`,
    }
  }

  const { error } = await supabase.from('ticket_types').delete().eq('id', id)
  if (error) {
    logActionError('deleteTicketTier', error)
    return { ok: false, message: 'Could not delete the tier. Please try again.' }
  }

  revalidatePath('/dashboard/organizer/tickets')
  revalidatePath(`/events/${(tier as any).event_id}`)
  revalidatePath('/events')

  return { ok: true, message: `"${tier.name}" deleted.` }
}
