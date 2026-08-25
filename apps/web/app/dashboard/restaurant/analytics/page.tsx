import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  ConsoleKpiCard,
  ConsoleRangeLinks,
  SectionTitle,
  Sparkline,
} from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Analytics · Restaurant' }

type RangeKey = '7d' | '30d' | '90d'
const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90 }

type ReservationRow = {
  guest_count: number | null
  reservation_date: string
  time_slot: string | null
}

function shift(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function trend(current: number, previous: number) {
  if (previous === 0 && current === 0) return undefined
  if (previous === 0) return { direction: 'flat' as const, text: `${current} this period` }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { direction: 'flat' as const, text: 'No change vs prior period' }
  return {
    direction: pct > 0 ? ('up' as const) : ('down' as const),
    text: `${Math.abs(pct)}% vs prior ${RANGE_LABEL}`,
  }
}

const RANGE_LABEL = 'period'

function dayparts(rows: ReservationRow[]) {
  let morning = 0
  let afternoon = 0
  let evening = 0
  let parsed = 0
  for (const row of rows) {
    const slot = row.time_slot ?? ''
    const match = slot.match(/^(\d{1,2})/)
    if (!match) continue
    parsed += 1
    const hour = Number(match[1])
    if (hour < 12) morning += 1
    else if (hour < 17) afternoon += 1
    else evening += 1
  }
  if (parsed === 0) return null
  const total = morning + afternoon + evening || 1
  return [
    { label: 'Morning', pct: Math.round((morning / total) * 100) },
    { label: 'Afternoon', pct: Math.round((afternoon / total) * 100) },
    { label: 'Evening', pct: Math.round((evening / total) * 100) },
  ]
}

export default async function RestaurantAnalyticsPage({
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
  const today = new Date().toISOString().slice(0, 10)
  const startISO = shift(today, days - 1)
  const prevStartISO = shift(startISO, days)

  // Owner scope: user -> business -> branches
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: branches } = business
    ? await supabase.from('branches').select('id').eq('business_id', business.id)
    : { data: [] }
  const branchIds = (branches ?? []).map((b) => b.id as string)

  const [listingsRes, reservationsRes] = await Promise.all([
    business
      ? supabase
          .from('restaurants')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business.id)
          .eq('is_active', true)
      : Promise.resolve({ count: 0 }),
    branchIds.length
      ? supabase
          .from('reservations')
          .select('guest_count, reservation_date, time_slot')
          .in('branch_id', branchIds)
          .gte('reservation_date', prevStartISO)
          .limit(5000)
      : Promise.resolve({ data: [] }),
  ])

  const allRows = ((reservationsRes.data ?? []) as ReservationRow[])
    .filter((r) => r.reservation_date >= prevStartISO && r.reservation_date <= today)

  const currentRows = allRows.filter((r) => r.reservation_date >= startISO)
  const previousRows = allRows.filter((r) => r.reservation_date < startISO)

  const bookings = currentRows.length
  const prevBookings = previousRows.length
  const covers = currentRows.reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0)
  const prevCovers = previousRows.reduce((sum, r) => sum + (Number(r.guest_count) || 0), 0)
  const avgParty = bookings ? covers / bookings : 0

  // Daily series across the selected window
  const daily = new Map<string, number>()
  for (let i = 0; i < days; i++) daily.set(shift(startISO, days - 1 - i), 0)
  for (const row of currentRows) {
    if (daily.has(row.reservation_date)) {
      daily.set(row.reservation_date, (daily.get(row.reservation_date) ?? 0) + 1)
    }
  }
  const seriesPoints = Array.from(daily.values())

  // Top booked slots
  const slotCounts = new Map<string, number>()
  for (const row of currentRows) {
    const slot = row.time_slot?.trim() || '—'
    slotCounts.set(slot, (slotCounts.get(slot) ?? 0) + 1)
  }
  const topSlots = Array.from(slotCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const topSlotMax = topSlots[0]?.[1] ?? 1

  const parts = dayparts(currentRows)

  const kpis = [
    { label: 'Reservations', value: String(bookings), trend: trend(bookings, prevBookings), accent: true },
    { label: 'Covers', value: String(covers), trend: trend(covers, prevCovers), accent: false },
    { label: 'Avg party size', value: avgParty ? avgParty.toFixed(1) : '—', trend: undefined, accent: false },
    { label: 'Active listings', value: String(listingsRes.count ?? 0), trend: undefined, accent: false },
  ]

  const hasData = bookings > 0

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Partner console"
        title="Analytics"
        subtitle="Real booking activity across your branches."
        action={<ConsoleRangeLinks current={range} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <ConsoleKpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} accent={kpi.accent} />
        ))}
      </section>

      {/* Bookings over time */}
      <section className="space-y-3">
        <SectionTitle>Bookings over time</SectionTitle>
        <div className={cn(CONSOLE_CARD, 'p-5')}>
          {hasData ? (
            <>
              <p className="mb-4 text-xs uppercase tracking-widest text-[#7587A7]">
                Past {days} days · reservations per day
              </p>
              <Sparkline points={seriesPoints} label={`Daily reservations over the past ${days} days`} />
            </>
          ) : (
            <div className="border-dashed py-8 text-center">
              <p className="font-semibold">Not enough data yet</p>
              <p className="mt-1 text-sm text-[#7587A7]">Bookings will chart here as they come in.</p>
            </div>
          )}
        </div>
      </section>

      {/* Daypart split */}
      <section className="space-y-3">
        <SectionTitle>Covers by daypart</SectionTitle>
        {parts ? (
          <div className={cn(CONSOLE_CARD, 'space-y-4 p-5')}>
            {parts.map((part) => (
              <div key={part.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-[#B5C7EA]">{part.label}</span>
                  <span className="font-semibold tabular-nums text-[#DFC391]">{part.pct}%</span>
                </div>
                <div aria-hidden className="h-2 overflow-hidden rounded-full bg-[#07192B]">
                  <div className="h-full rounded-full bg-[#C2A878]" style={{ width: `${part.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-[#7587A7]">Daypart mix appears once reservations carry time slots.</p>
          </div>
        )}
      </section>

      {/* Top booked slots — honest substitute for the artboard's revenue list */}
      <section className="space-y-3">
        <SectionTitle>Most requested slots</SectionTitle>
        {topSlots.length > 0 ? (
          <ol className={cn(CONSOLE_CARD, 'divide-y divide-[#4d5f7d]/15')}>
            {topSlots.map(([slot, count], i) => (
              <li key={slot} className="flex items-center gap-4 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#4d5f7d]/30 bg-[#07192B] font-serif text-xs font-bold tabular-nums text-[#DFC391]">
                  {i + 1}
                </span>
                <span className="w-16 shrink-0 font-semibold tabular-nums">{slot}</span>
                <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-[#07192B]">
                  <span className="block h-full rounded-full bg-[#C2A878]/70" style={{ width: `${Math.round((count / topSlotMax) * 100)}%` }} />
                </span>
                <span className="shrink-0 text-xs tabular-nums text-[#7587A7]">{count} bookings</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-[#7587A7]">No reservations in this period yet.</p>
          </div>
        )}
        <p className="px-1 text-xs text-[#7587A7]">
          Revenue and dish-level analytics unlock once order tracking ships — we don&apos;t show estimates.
        </p>
      </section>
    </ConsolePageShell>
  )
}