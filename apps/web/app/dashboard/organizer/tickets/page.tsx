import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerAccount } from '@/lib/dashboard/organizer-data'
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

export default async function TicketsPage({
  searchParams,
}: {
  searchParams?: { event?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const organizer = await getOrganizerAccount(supabase, user)

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
    <div className="space-y-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-ember">Organizer</p>
      <h1 className="mt-2  text-3xl font-bold text-app-fg">Ticket Management</h1>
      <p className="mt-2 text-sm text-app-muted">
        Configure ticket tiers and pricing for your events. Changes go live immediately.
      </p>

      {!organizer && (
        <section className="animate-pop-in mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-app-fg">
          No linked organizer profile was found for your account. Complete organizer signup first.
        </section>
      )}

      {organizer && eventOptions.length === 0 && (
        <section className="animate-pop-in mt-6 rounded-xl border border-dashed border-app-border bg-app-card p-8 text-center">
          <h2 className="text-lg font-bold text-app-fg">No events to add tickets to yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-app-muted">
            Create an event first. Then choose it here to add and manage its ticket types.
          </p>
          <Link
            href="/dashboard/organizer/events/new"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-ember px-5 text-sm font-semibold text-on-accent"
          >
            Create event
          </Link>
        </section>
      )}

      {organizer && (
        <TiersManager
          key={searchParams?.event ?? 'default'}
          events={eventOptions}
          initialTiers={tiers}
          initialEventId={searchParams?.event}
        />
      )}
    </div>
  )
}
