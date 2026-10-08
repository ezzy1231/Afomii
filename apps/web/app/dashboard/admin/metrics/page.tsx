import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  ConsoleKpiCard,
} from '@/components/dashboard/console'
import { ConsoleAreaChart } from '@/components/dashboard/console-area-chart'

export const metadata: Metadata = { title: 'Metrics · Admin' }

const WINDOW_DAYS = 30

function shiftDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function trend(current: number, previous: number) {
  if (previous === 0 && current === 0) return undefined
  if (previous === 0) return { direction: 'flat' as const, text: `${current} in the last 30d` }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { direction: 'flat' as const, text: 'No change vs prior 30d' }
  return {
    direction: pct > 0 ? ('up' as const) : ('down' as const),
    text: `${Math.abs(pct)}% vs prior 30d`,
  }
}

/** Bucket timestamped rows into per-day counts across the last N days. */
function dailySeries(timestamps: string[], days: number) {
  const today = new Date().toISOString().slice(0, 10)
  const buckets = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(`${today}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  for (const ts of timestamps) {
    const day = ts.slice(0, 10)
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1)
  }
  return Array.from(buckets.entries()).map(([date, value]) => ({
    label: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value,
  }))
}

export default async function AdminMetricsPage() {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const startIso = shiftDays(nowIso, WINDOW_DAYS - 1)
  const prevStartIso = shiftDays(startIso, WINDOW_DAYS)

  const [usersRes, businessesRes, organizersRes, eventsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('organizers').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ])

  // Windowed activity for trends + charts. Capped at 5000 rows per query —
  // plenty at launch scale; move to an aggregate RPC when it isn't.
  const [signupsRes, reservationsRes, purchasesRes] = await Promise.all([
    supabase.from('profiles').select('created_at').gte('created_at', prevStartIso).limit(5000),
    supabase
      .from('reservations')
      .select('reservation_date')
      .gte('reservation_date', prevStartIso.slice(0, 10))
      .limit(5000),
    supabase
      .from('ticket_purchases')
      .select('quantity, amount, payment_status, created_at')
      .gte('created_at', prevStartIso)
      .eq('payment_status', 'paid')
      .limit(5000),
  ])

  const signups = ((signupsRes.data ?? []) as Array<{ created_at: string }>)
    .filter((r) => r.created_at >= prevStartIso && r.created_at <= nowIso)
  const currentSignups = signups.filter((r) => r.created_at >= startIso).length
  const prevSignups = signups.length - currentSignups

  const bookings = ((reservationsRes.data ?? []) as Array<{ reservation_date: string }>)
    .filter((r) => r.reservation_date >= prevStartIso.slice(0, 10) && r.reservation_date <= nowIso.slice(0, 10))
  const currentBookings = bookings.filter((r) => r.reservation_date >= startIso.slice(0, 10)).length
  const prevBookings = bookings.length - currentBookings

  const paidPurchases = ((purchasesRes.data ?? []) as Array<{
    quantity: number | null
    amount: number | null
    created_at: string
  }>).filter((p) => p.created_at >= prevStartIso && p.created_at <= nowIso)
  const currentTickets = paidPurchases
    .filter((p) => p.created_at >= startIso)
    .reduce((s, p) => s + (Number(p.quantity) || 0), 0)
  const prevTickets =
    paidPurchases.filter((p) => p.created_at < startIso).reduce((s, p) => s + (Number(p.quantity) || 0), 0)
  const paidVolume30d = paidPurchases
    .filter((p) => p.created_at >= startIso)
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)

  const signupSeries = dailySeries(signups.map((r) => r.created_at), WINDOW_DAYS)
  const bookingSeries = dailySeries(
    bookings.map((r) => `${r.reservation_date}T12:00:00Z`),
    WINDOW_DAYS,
  )
  const ticketSeries = dailySeries(paidPurchases.map((p) => p.created_at), WINDOW_DAYS)

  const kpis = [
    { label: 'Total users', value: String(usersRes.count ?? 0), trend: trend(currentSignups, prevSignups), accent: false },
    { label: 'Businesses', value: String(businessesRes.count ?? 0), trend: undefined, accent: false },
    { label: 'Organizers', value: String(organizersRes.count ?? 0), trend: undefined, accent: false },
    { label: 'Live events', value: String(eventsRes.count ?? 0), trend: undefined, accent: false },
    { label: 'Bookings · 30d', value: String(currentBookings), trend: trend(currentBookings, prevBookings), accent: false },
    {
      label: 'Paid ticket volume · 30d',
      value: `ETB ${paidVolume30d.toLocaleString('en-US')}`,
      trend: trend(currentTickets, prevTickets),
      accent: true,
    },
  ]

  const charts: Array<{ title: string; points: Array<{ label: string; value: number }>; unit: string }> = [
    { title: 'New signups', points: signupSeries, unit: 'users' },
    { title: 'Reservations', points: bookingSeries, unit: 'reservations' },
    { title: 'Paid tickets', points: ticketSeries, unit: 'tickets' },
  ]

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Platform Metrics"
        subtitle="Growth and activity across the whole marketplace."
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <ConsoleKpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} accent={kpi.accent} />
        ))}
      </section>

      {charts.map((chart) => (
        <ConsoleAreaChart key={chart.title} title={chart.title} unit={chart.unit} series={{ [`Past ${WINDOW_DAYS} days`]: chart.points }} />
      ))}

      <p className="px-1 text-xs text-app-muted">
        Aggregates are computed from up to 5,000 recent rows per series — swap to an aggregate RPC when volumes outgrow this.
      </p>
    </ConsolePageShell>
  )
}
