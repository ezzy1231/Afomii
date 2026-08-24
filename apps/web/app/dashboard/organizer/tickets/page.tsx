import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TiersManager } from './tiers-manager'

export const metadata: Metadata = { title: 'Ticket Management' }

export type EventOption = { id: string; title: string }
export type TierRecord = {
  id: string
  eventId: string
  name: string
  tier: string
  price: number
  totalQuantity: number
  remainingQuantity: number
  salesStart: string
  salesEnd: string
}

export default async function TicketsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: events } = organizer
    ? await supabase
        .from('events')
        .select('id, title')
        .eq('organizer_id', organizer.id)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const eventOptions: EventOption[] = events ?? []
  const eventIds = eventOptions.map((e) => e.id)

  let tiers: TierRecord[] = []
  if (eventIds.length) {
    const { data } = await supabase
      .from('ticket_types')
      .select(
        'id, event_id, name, tier, price, total_quantity, remaining_quantity, sales_start, sales_end'
      )
      .in('event_id', eventIds)
      .order('price', { ascending: true })

    tiers = (data ?? []).map((t: any) => ({
      id: t.id,
      eventId: t.event_id,
      name: t.name,
      tier: t.tier ?? 'standard',
      price: Number(t.price),
      totalQuantity: t.total_quantity,
      remainingQuantity: t.remaining_quantity,
      salesStart: t.sales_start ? String(t.sales_start) : '',
      salesEnd: t.sales_end ? String(t.sales_end) : '',
    }))
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Organizer</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Ticket Management</h1>
      <p className="mt-2 text-sm text-app-muted">
        Configure ticket tiers and pricing for your events. Changes go live immediately.
      </p>

      {!organizer && (
        <section className="animate-pop-in mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-app-fg">
          No linked organizer profile was found for your account. Complete organizer signup first.
        </section>
      )}

      {organizer && eventOptions.length === 0 && (
        <section className="animate-pop-in mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-app-fg">
          Create an event first — ticket tiers attach to an event.
        </section>
      )}

      {organizer && <TiersManager events={eventOptions} initialTiers={tiers} />}
    </div>
  )
}
