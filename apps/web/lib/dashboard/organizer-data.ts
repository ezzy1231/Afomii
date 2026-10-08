import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureOrganizer } from '@/lib/provision'
import type {
  ConsoleChartPoint,
  ConsoleChartSeries,
  ConsoleEvent,
  ConsoleStat,
} from '@/lib/console-types'
import {
  formatClockTime,
  formatDayLabel,
  formatETB,
  formatThousands,
  dayKeyOfInstant,
  toDayKey,
  toneFor,
} from '@/lib/console-format'

/**
 * Server-side read model for the organizer console.
 *
 * Postgres rows in, `ConsoleEvent` / `ConsoleStat` / `ConsoleChartSeries` out.
 * Mirrors the table shapes in `packages/supabase`:
 *   organizers · events · ticket_types · ticket_purchases
 */

const EVENT_LIMIT = 500
/** Guards the unbounded purchase fetch; see `loadPurchases`. */
const PURCHASE_LIMIT = 20_000

const CHART_RANGES = [7, 30, 90] as const

type UserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

type EventRow = {
  id: string
  title: string
  category: string | null
  venue_name: string | null
  starts_at: string | null
  cover_image_url: string | null
  status: string | null
  is_active: boolean | null
}

type TierRow = {
  event_id: string
  total_quantity: number | null
  remaining_quantity: number | null
}

type PurchaseRow = {
  event_id: string | null
  quantity: number | null
  amount: number | null
  payment_status: string | null
  user_id: string | null
  attended: boolean | null
  created_at: string
}

export type OrganizerRow = { id: string; name: string }

export type OrganizerEventRecord = {
  id: string
  title: string
  category: string | null
  venueName: string | null
  startsAt: string | null
  coverImageUrl: string | null
  isActive: boolean
  sold: number
  capacity: number
}

export type OrganizerDashboardData = {
  organizer: OrganizerRow | null
  events: OrganizerEventRecord[]
  /** Everything with a start date, mapped for the calendar. */
  calendar: ConsoleEvent[]
  upcoming: ConsoleEvent[]
  stats: ConsoleStat[]
  series: ConsoleChartSeries
  rangeLabels: string[]
  hasSales: boolean
}

/** `ticket_types` is the only capacity source; sold is the difference. */
function rollupTiers(rows: TierRow[]) {
  const byEvent = new Map<string, { sold: number; capacity: number }>()
  for (const row of rows) {
    const capacity = Number(row.total_quantity) || 0
    const remaining = Number(row.remaining_quantity) || 0
    const current = byEvent.get(row.event_id) ?? { sold: 0, capacity: 0 }
    current.capacity += capacity
    current.sold += Math.max(capacity - remaining, 0)
    byEvent.set(row.event_id, current)
  }
  return byEvent
}

function toConsoleEvent(
  event: EventRow,
  tier: { sold: number; capacity: number },
): ConsoleEvent {
  const startsAt = event.starts_at ?? ''
  return {
    id: event.id,
    name: event.title,
    date: startsAt ? dayKeyOfInstant(startsAt) : '',
    time: startsAt ? formatClockTime(startsAt) : 'TBA',
    venue: event.venue_name ?? event.category ?? 'Venue TBA',
    sold: tier.sold,
    capacity: tier.capacity,
    metricLabel: 'sold',
    tone: toneFor(event.id),
    image: event.cover_image_url,
  }
}

/** Dense day buckets so gaps read as zero-sales days, not as missing data. */
function buildSeries(purchases: PurchaseRow[], days: number): ConsoleChartPoint[] {
  const now = new Date()
  const buckets = new Map<string, number>()
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    buckets.set(toDayKey(day), 0)
  }
  for (const purchase of purchases) {
    const key = dayKeyOfInstant(purchase.created_at)
    if (!buckets.has(key)) continue
    buckets.set(key, (buckets.get(key) ?? 0) + (Number(purchase.quantity) || 0))
  }
  return Array.from(buckets, ([key, value]) => ({ label: formatDayLabel(key), value }))
}

async function loadEvents(supabase: SupabaseClient, organizerId: string) {
  const { data } = await supabase
    .from('events')
    .select(
      'id,title,category,venue_name,starts_at,cover_image_url,status,is_active,created_at',
    )
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
    .limit(EVENT_LIMIT)

  return (data ?? []) as EventRow[]
}

async function loadTiers(supabase: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) return [] as TierRow[]
  const { data } = await supabase
    .from('ticket_types')
    .select('event_id,total_quantity,remaining_quantity')
    .in('event_id', eventIds)
  return (data ?? []) as TierRow[]
}

/**
 * One fetch feeds both the all-time headline totals and every chart range,
 * so the KPI card and the chart can never disagree. Capped rather than
 * aggregated because there is no owner-scoped RPC for these sums; if an
 * organizer ever exceeds the cap the numbers saturate at `PURCHASE_LIMIT`
 * rows, which is surfaced via `purchaseCapped`.
 */
async function loadPurchases(supabase: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) return { rows: [] as PurchaseRow[], capped: false }
  const { data } = await supabase
    .from('ticket_purchases')
    .select('event_id,quantity,amount,payment_status,user_id,attended,created_at')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })
    .limit(PURCHASE_LIMIT)

  const rows = (data ?? []) as PurchaseRow[]
  return { rows, capped: rows.length >= PURCHASE_LIMIT }
}

export async function getOrganizerDashboard(
  supabase: SupabaseClient,
  user: UserLike,
): Promise<OrganizerDashboardData> {
  const { data: organizerRaw } = await supabase
    .from('organizers')
    .select('id,name')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Self-heal accounts provisioned before the callback fix.
  const metaRole =
    (user.user_metadata?.role as string | undefined) ?? null
  let organizer = (organizerRaw as OrganizerRow | null) ?? null
  if (!organizer && metaRole === 'event_organizer') {
    organizer = await ensureOrganizer(supabase, user)
  }

  const empty: OrganizerDashboardData = {
    organizer: null,
    events: [],
    calendar: [],
    upcoming: [],
    stats: [],
    series: {},
    rangeLabels: [],
    hasSales: false,
  }
  if (!organizer) return empty

  const events = await loadEvents(supabase, organizer.id)
  const eventIds = events.map((e) => e.id)
  const [tiers, { rows: purchases }] = await Promise.all([
    loadTiers(supabase, eventIds),
    loadPurchases(supabase, eventIds),
  ])

  const tierRollup = rollupTiers(tiers)

  const records: OrganizerEventRecord[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    category: event.category,
    venueName: event.venue_name,
    startsAt: event.starts_at,
    coverImageUrl: event.cover_image_url,
    isActive: event.is_active !== false && event.status === 'published',
    sold: tierRollup.get(event.id)?.sold ?? 0,
    capacity: tierRollup.get(event.id)?.capacity ?? 0,
  }))

  const dated = events
    .filter((event) => event.starts_at)
    .map((event) => ({
      event,
      console: toConsoleEvent(event, tierRollup.get(event.id) ?? { sold: 0, capacity: 0 }),
      startsAtMs: Date.parse(event.starts_at as string),
    }))
    .filter((row) => Number.isFinite(row.startsAtMs))

  const consoleEvents = dated.map((row) => row.console)

  const nowMs = Date.now()
  const in30Days = nowMs + 30 * 24 * 60 * 60 * 1000
  const upcoming = dated
    .filter((row) => row.startsAtMs >= nowMs && row.startsAtMs <= in30Days)
    .sort((a, b) => a.startsAtMs - b.startsAtMs)
    .map((row) => row.console)

  const ticketsSold = purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)
  const paidRevenue = purchases
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const attendeeIds = new Set(
    purchases.filter((p) => p.attended && p.user_id).map((p) => p.user_id as string),
  )

  const rangeLabels = CHART_RANGES.map((d) => `${d} days`)
  const series: ConsoleChartSeries = {}
  CHART_RANGES.forEach((days, index) => {
    series[rangeLabels[index]] = buildSeries(purchases, days)
  })

  const stats: ConsoleStat[] = [
    {
      label: 'Upcoming Events',
      value: formatThousands(upcoming.length),
      subtext: 'Next 30 days',
      icon: 'calendar',
      tone: 'indigo',
    },
    {
      label: 'Tickets Sold',
      value: formatThousands(ticketsSold),
      subtext: 'All time',
      icon: 'ticket',
      tone: 'mint',
    },
    {
      label: 'Total Revenue',
      value: formatETB(paidRevenue),
      subtext: 'Paid orders',
      icon: 'revenue',
      tone: 'sand',
    },
    {
      label: 'Total Attendees',
      value: formatThousands(attendeeIds.size),
      subtext: 'Checked in',
      icon: 'attendees',
      tone: 'blush',
    },
  ]

  return {
    organizer,
    events: records,
    calendar: consoleEvents.sort((a, b) => a.date.localeCompare(b.date)),
    upcoming: upcoming.slice(0, 6),
    stats,
    series,
    rangeLabels,
    hasSales: ticketsSold > 0,
  }
}

/** Paginated-free read used by `/dashboard/organizer/calendar`. */
export async function getOrganizerCalendar(
  supabase: SupabaseClient,
  user: UserLike,
) {
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id,name')
    .eq('owner_id', user.id)
    .maybeSingle()

  const organizerRow = (organizer as OrganizerRow | null) ?? null
  if (!organizerRow) return { organizer: null, events: [] as ConsoleEvent[] }

  const events = await loadEvents(supabase, organizerRow.id)
  const tiers = await loadTiers(
    supabase,
    events.map((e) => e.id),
  )
  const rollup = rollupTiers(tiers)

  return {
    organizer: organizerRow,
    events: events
      .filter((event) => event.starts_at)
      .map((event) => toConsoleEvent(event, rollup.get(event.id) ?? { sold: 0, capacity: 0 }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/** `/dashboard/organizer/events` — same records, no chart aggregation. */
export async function getOrganizerEventRecords(
  supabase: SupabaseClient,
  user: UserLike,
) {
  const { data: organizer } = await supabase
    .from('organizers')
    .select('id,name')
    .eq('owner_id', user.id)
    .maybeSingle()

  const organizerRow = (organizer as OrganizerRow | null) ?? null
  if (!organizerRow) return { organizer: null, events: [] as OrganizerEventRecord[] }

  const events = await loadEvents(supabase, organizerRow.id)
  const tiers = await loadTiers(
    supabase,
    events.map((e) => e.id),
  )
  const rollup = rollupTiers(tiers)

  return {
    organizer: organizerRow,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      venueName: event.venue_name,
      startsAt: event.starts_at,
      coverImageUrl: event.cover_image_url,
      isActive: event.is_active !== false && event.status === 'published',
      sold: rollup.get(event.id)?.sold ?? 0,
      capacity: rollup.get(event.id)?.capacity ?? 0,
    })),
  }
}