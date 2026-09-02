import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  SectionTitle,
  StatusPill,
  ConsoleKpiCard,
} from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { OrganizerVerificationActions } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Organizer detail · Admin' }

export default async function AdminOrganizerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, name, email, description, status, is_verified, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (!organizer) notFound()
  const o = organizer as unknown as {
    id: string
    name: string
    email: string | null
    description: string | null
    status: string
    is_verified: boolean | null
    created_at: string | null
  }

  // Events + purchase aggregates across them.
  const { data: eventRows } = await supabase
    .from('events')
    .select('id, title, status, starts_at, venue_name')
    .eq('organizer_id', o.id)
    .order('starts_at', { ascending: false, nullsFirst: false })
  const events = (eventRows ?? []) as Array<{
    id: string; title: string; status: string; starts_at: string | null; venue_name: string | null
  }>
  const eventIds = events.map((e) => e.id)

  let ticketsSold = 0
  let paidRevenue = 0
  if (eventIds.length) {
    const { data: purchases } = await supabase
      .from('ticket_purchases')
      .select('quantity, amount, payment_status')
      .in('event_id', eventIds)
      .limit(5000)
    for (const p of (purchases ?? []) as Array<{ quantity: number | null; amount: number | null; payment_status: string }>) {
      ticketsSold += Number(p.quantity) || 0
      if (p.payment_status === 'paid') paidRevenue += Number(p.amount) || 0
    }
  }

  const kpis = [
    { label: 'Events', value: String(events.length), accent: false },
    { label: 'Tickets sold', value: String(ticketsSold), accent: true },
    { label: 'Paid revenue', value: `ETB ${paidRevenue.toLocaleString('en-US')}`, accent: false },
  ]

  return (
    <ConsolePageShell>
      <Link
        href="/dashboard/admin/organizers"
        className="text-xs font-semibold uppercase tracking-widest text-app-muted transition-colors hover:text-ember"
      >
        ← Back to organizers
      </Link>

      <ConsoleHeader
        eyebrow="Organizer · admin view"
        title={o.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={o.status} tone={statusTone(o.status)} />
            <OrganizerVerificationActions organizerId={o.id} status={o.status} />
          </div>
        }
      />

      {/* About */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className={cn(CONSOLE_CARD, 'space-y-2 p-5 text-sm')}>
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">Contact</h2>
          <p>{o.email ?? 'No public email'}</p>
          <p className="text-xs tabular-nums text-app-muted">
            ID: {o.id.slice(0, 8).toUpperCase()}
            {o.created_at &&
              ` · joined ${new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <div className={cn(CONSOLE_CARD, 'space-y-2 p-5 text-sm')}>
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">About</h2>
          <p className="leading-relaxed text-app-muted">{o.description ?? 'No bio provided yet.'}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <ConsoleKpiCard key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} />
        ))}
      </section>

      {/* Events */}
      <section className="space-y-3">
        <SectionTitle>Events</SectionTitle>
        {events.length === 0 ? (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-app-muted">This organizer has not created any events yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className={cn(CONSOLE_CARD, 'flex items-center justify-between p-4')}>
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/admin/events/${e.id}`}
                    className="block truncate text-sm font-semibold underline-offset-2 hover:underline"
                  >
                    {e.title}
                  </Link>
                  <p className="text-xs capitalize text-app-muted">
                    {[e.venue_name, e.starts_at ? new Date(e.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null]
                      .filter(Boolean)
                      .join(' · ') || 'Date TBD'}
                  </p>
                </div>
                <StatusPill status={e.status} tone={statusTone(e.status)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </ConsolePageShell>
  )
}