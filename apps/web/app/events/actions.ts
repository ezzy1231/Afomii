'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { firstIssue, logActionError, purchaseTicketsInputSchema, uuidSchema } from '@/lib/validation'
import { ACTION_LIMITS, RATE_LIMIT_MESSAGE, guardActionLimit } from '@/lib/rate-limit'

/** Client IP for rate limiting (first hop; best-effort behind proxies). */
async function clientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  )
}

export type TicketActionState = {
  ok: boolean
  message: string
  id?: string
  code?: string
}

type CompletePurchaseRow = {
  purchase_id: string
  qr_code: string
}

export async function purchaseTickets(input: {
  ticketTypeId: string
  quantity: number
}): Promise<TicketActionState> {
  // Rate limit first — before any Supabase work. Keyed by user id when
  // available, else client IP.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ip = await clientIp()
  const limit = guardActionLimit('purchaseTickets', user?.id ?? `ip:${ip}`, ACTION_LIMITS.purchase)
  if (!limit.ok) return { ok: false, message: RATE_LIMIT_MESSAGE }

  if (!user) return { ok: false, message: 'Please sign in to buy tickets.' }

  const parsed = purchaseTicketsInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: firstIssue(parsed.error) }
  const { ticketTypeId, quantity: qty } = parsed.data

  // Atomic inventory hold (decrements remaining_quantity server-side).
  const { data: holdId, error: holdErr } = await supabase.rpc('hold_ticket', {
    p_ticket_type_id: ticketTypeId,
    p_quantity: qty,
  })

  if (holdErr || !holdId) {
    const msg = holdErr?.message ?? ''
    logActionError('purchaseTickets.hold', msg || 'no hold returned')
    if (msg.includes('TICKET_INSUFFICIENT_INVENTORY')) {
      return { ok: false, message: 'Not enough tickets left for this tier.' }
    }
    if (msg.includes('INVALID_QUANTITY')) {
      return { ok: false, message: 'Choose a valid number of tickets.' }
    }
    return { ok: false, message: 'Could not reserve tickets. Please try again.' }
  }

  // Server-side purchase creation (validates the hold, prices the order,
  // generates the QR token). Direct table inserts are revoked by migration 0007.
  const { data, error: purchaseErr } = await supabase.rpc('complete_purchase', {
    p_hold_id: holdId,
  })

  const row: CompletePurchaseRow | undefined = Array.isArray(data) ? data[0] : (data as CompletePurchaseRow | null) ?? undefined

  if (purchaseErr || !row?.purchase_id) {
    // Purchase failed after the hold consumed inventory — restore it atomically.
    await supabase.rpc('release_ticket_hold', { p_hold_id: holdId })
    const msg = purchaseErr?.message ?? ''
    logActionError('purchaseTickets.complete', msg || 'no purchase row returned')
    if (msg.includes('HOLD_NOT_ACTIVE') || msg.includes('HOLD_NOT_FOUND')) {
      return { ok: false, message: 'Your ticket reservation expired. Please try again.' }
    }
    return { ok: false, message: 'Purchase could not be completed. Any held tickets were returned.' }
  }

  revalidatePath('/settings')
  revalidatePath('/events')
  // The RPC knows the event; fetch it only for cache revalidation.
  const { data: tt, error: ttError } = await supabase
    .from('ticket_types')
    .select('event_id')
    .eq('id', ticketTypeId)
    .maybeSingle()
  if (ttError) logActionError('purchaseTickets.revalidate', ttError)
  if (tt?.event_id) revalidatePath(`/events/${tt.event_id}`)

  return {
    ok: true,
    id: row.purchase_id,
    code: row.qr_code,
    message: `Purchased ${qty} ticket${qty > 1 ? 's' : ''} successfully.`,
  }
}
