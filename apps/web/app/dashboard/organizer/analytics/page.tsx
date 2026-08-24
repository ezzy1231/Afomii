import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  ConsoleKpiCard,
  ConsoleRangeLinks,
  SectionTitle,
  CONSOLE_CARD,
  Sparkline,
} from '@/components/dashboard/console'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Analytics · Organizer' }

type RangeKey = '7d' | '30d' | '90d'
const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90 }

type PurchaseRow = {
  event_id: string
  quantity: number | null
  amount: number | null
  payment_status: string | null
  attended: boolean | null
  created_at: string
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function trend(current: number, previous: number) {
  if (previous === 0 && current === 0) return undefined
  if (previous === 0) return { direction: 'flat' as const, text: `${current} this period` }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { direction: 'flat' as const, text: 'No change vs prior period' }
  return {
    direction: pct > 0 ? ('up' as const) : ('down' as const),
    text: `${Math.abs(pct)}% vs prior period`,
  }
}

function formatETB(value: number): string {
  return `ETB ${value.toLocaleString('en-US')}`
}

export default async function OrganizerAnalyticsPage({
  searchParams,
}: {
  searchParams?: { range?: string }
}) {
  const range: RangeKey =
    searchParams?.range === '7d' || searchParams?.range === '90d'
      ? searchParams.range
      : '30d'
  const days = RANGE_DAYS[range]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const nowIso = new Date().toISOString()
  const startIso = shiftDays(nowIso, days - 1)
  const prevStartIso = shiftDays(startIso, days)

  // Owner scope: user -> organizer -> events
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: events } = organizer
    ? await supabase.from('events').select('id, title, is_active').eq('organizer_id', organizer.id)
    : { data: [] }
  const eventRows = (events ?? []) as Array<{ id: string; title: string; is_active: boolean | null }>
  const eventIds = eventRows.map((e) => e.id)
  const eventTitles = new Map(eventRows.map((e) => [e.id, e.title]))

  const purchasesRes = eventIds.length
    ? await supabase
        .from('ticket_purchases')
        .select('event_id, quantity, amount, payment_status, attended, created_at')
        .in('event_id', eventIds)
        .gte('created_at', prevStartIso)
        .limit(5000)
    : { data: [] }

  const allPurchases = ((purchasesRes.data ?? []) as PurchaseRow[])
    .filter((p) => p.created_at >= prevStartIso && p.created_at <= nowIso)

  const currentPurchases = allPurchases.filter((p) => p.created_at >= startIso)
  const previousPurchases = allPurchases.filter((p) => p.created_at < startIso)

  const ticketsSold = currentPurchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)
  const prevTickets = previousPurchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)
  const paidRevenue = currentPurchases
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const prevPaidRevenue = previousPurchases
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const attendees = currentPurchases.filter((p) => p.attended).length

  // Daily ticket series across the selected window
  const daily = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    daily.set(shiftDays(new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).toISOString(), days - 1 - i).slice(0, 10), 0)
  }
  for (const p of currentPurchases) {
    const day = p.created_at.slice(0, 10)
    if (daily.has(day)) daily.set(day, (daily.get(day) ?? 0) + (Number(p.quantity) || 0))
  }
  const seriesPoints = Array.from(daily.values())

  // Top events by paid revenue
  const revenueByEvent = new Map<string, number>()
  for (const p of currentPurchases) {
    if (p.payment_status !== 'paid') continue
    revenueByEvent.set(p.event_id, (revenueByEvent.get(p.event_id) ?? 0) + (Number(p.amount) || 0))
  }
  const topEvents = Array.from(revenueByEvent.entries())
    .map(([id, amount]) => ({ title: eventTitles.get(id) ?? 'Untitled event', amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
  const topMax = topEvents[0]?.amount ?? 1

  const liveEvents = eventRows.filter((e) => e.is_active !== false).length

  const kpis = [
    { label: 'Tickets sold', value: String(ticketsSold), trend: trend(ticketsSold, prevTickets), accent: true },
    { label: 'Paid revenue', value: formatETB(paidRevenue), trend: trend(paidRevenue, prevPaidRevenue), accent: false },
    { label: 'Attendees checked in', value: String(attendees), trend: undefined, accent: false },
    { label: 'Live events', value: String(liveEvents), trend: undefined, accent: false },
  ]

  const hasData = ticketsSold > 0 || paidRevenue > 0

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Organizer console"
        title="Analytics"
        subtitle="Real ticket activity across your events."
        action={<ConsoleRangeLinks current={range} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <ConsoleKpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} accent={kpi.accent} />
        ))}
      </section>

      {/* Tickets over time */}
      <section className="space-y-3">
        <SectionTitle>Tickets over time</SectionTitle>
        <div className={cn(CONSOLE_CARD, 'p-5')}>
          {hasData ? (
            <>
              <p className="mb-4 text-xs uppercase tracking-widest text-[#7587A7]">
                Past {days} days · tickets sold per day
              </p>
              <Sparkline points={seriesPoints} label={`Daily ticket sales over the past ${days} days`} />
            </>
          ) : (
            <div className="border-dashed py-8 text-center">
              <p className="font-semibold">Not enough data yet</p>
              <p className="mt-1 text-sm text-[#7587A7]">Ticket sales will chart here as they come in.</p>
            </div>
          )}
        </div>
      </section>

      {/* Top events */}
      <section className="space-y-3">
        <SectionTitle>Top events · paid revenue</SectionTitle>
        {topEvents.length > 0 ? (
          <ol className={cn(CONSOLE_CARD, 'divide-y divide-[#4d5f7d]/15')}>
            {topEvents.map((event, i) => (
              <li key={event.title} className="flex items-center gap-4 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#4d5f7d]/30 bg-[#07192B] font-serif text-xs font-bold tabular-nums text-[#DFC391]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{event.title}</span>
                <span aria-hidden className="hidden h-2 w-32 overflow-hidden rounded-full bg-[#07192B] sm:block">
                  <span className="block h-full rounded-full bg-[#C2A878]/70" style={{ width: `${Math.max(4, Math.round((event.amount / topMax) * 100))}%` }} />
                </span>
                <span className="shrink-0 font-serif text-sm font-bold tabular-nums text-[#DFC391]">
                  {formatETB(event.amount)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-[#7587A7]">No paid ticket sales in this period yet.</p>
          </div>
        )}
      </section>
    </ConsolePageShell>
  )
}
