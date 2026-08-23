'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type TicketActionState = {
  ok: boolean
  message: string
  id?: string
  code?: string
}

export async function purchaseTickets(input: {
  ticketTypeId: string
  quantity: number
}): Promise<TicketActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, message: 'Please sign in to buy tickets.' }

  const qty = Math.max(1, Math.floor(input.quantity || 1))
  if (!input.ticketTypeId) return { ok: false, message: 'Select a ticket to purchase.' }

  // Atomic inventory hold (decrements remaining_quantity).
  const { data: holdId, error: holdErr } = await supabase.rpc('hold_ticket', {
    p_ticket_type_id: input.ticketTypeId,
    p_quantity: qty,
    p_user_id: user.id,
  })

  if (holdErr) {
    const msg = holdErr.message
    if (msg.includes('TICKET_INSUFFICIENT_INVENTORY')) {
      return { ok: false, message: 'Not enough tickets left for this tier.' }
    }
    return { ok: false, message: 'Could not reserve tickets. Please try again.' }
  }

  const { data: tt } = await supabase
    .from('ticket_types')
    .select('price, event_id')
    .eq('id', input.ticketTypeId)
    .maybeSingle()

  const amount = (Number(tt?.price) || 0) * qty
  const eventId = tt?.event_id

  const { data: purchase, error: insErr } = await supabase
    .from('ticket_purchases')
    .insert({
      ticket_type_id: input.ticketTypeId,
      event_id: eventId,
      user_id: user.id,
      quantity: qty,
      amount,
      currency: 'ETB',
      payment_status: 'paid',
      qr_code: `UE-${user.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    })
    .select('id, qr_code')
    .maybeSingle()

  // Release the temporary hold; inventory is already consumed by the purchase.
  await supabase
    .from('ticket_holds')
    .delete()
    .eq('id', holdId)
    .eq('user_id', user.id)
    .then(() => {})

  if (insErr || !purchase) {
    return { ok: false, message: 'Purchase could not be completed.' }
  }

  revalidatePath('/settings')
  if (eventId) revalidatePath(`/events/${eventId}`)

  return {
    ok: true,
    id: purchase.id,
    code: purchase.qr_code,
    message: `Purchased ${qty} ticket${qty > 1 ? 's' : ''} successfully.`,
  }
}
