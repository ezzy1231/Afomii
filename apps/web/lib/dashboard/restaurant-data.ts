import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureBusiness } from '@/lib/provision'
import type {
  ConsoleChartPoint,
  ConsoleChartSeries,
  ConsoleEvent,
  ConsoleStat,
} from '@/lib/console-types'
import {
  formatDayLabel,
  formatThousands,
  pluralize,
  toDayKey,
  toneFor,
} from '@/lib/console-format'

/**
 * Server-side read model for the restaurant console.
 *
 * Postgres rows in, `ConsoleEvent` / `ConsoleStat` / `ConsoleChartSeries` out.
 * Mirrors the table shapes in `packages/supabase`:
 *   businesses · branches · restaurants · reservations · menu_items
 *
 * There is no orders table, so restaurant revenue is not derivable — the
 * KPI row uses countable metrics instead of inventing a money number.
 */

const CHART_RANGES = [7, 30, 90] as const
/** Enough rows to fill a month grid for a busy venue, capped for safety. */
const RESERVATION_LIMIT = 2000

const OPEN_STATUSES = new Set(['pending', 'confirmed'])

type UserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

export type BusinessRow = { id: string; name: string }

export type TodayReservation = {
  id: string
  timeSlot: string | null
  guestCount: number
  status: string
  /** Resolved against `contacts` by the page. */
  userId: string | null
}

type ReservationRow = {
  id: string
  branch_id: string
  user_id: string | null
  reservation_date: string
  time_slot: string | null
  guest_count: number
  status: string
}

export type RestaurantDashboardData = {
  business: BusinessRow | null
  branches: Array<{ id: string; name: string }>
  /** Every dated reservation from today forward, oldest first. */
  calendar: ConsoleEvent[]
  /** Open bookings, capped for the sidebar list. */
  upcoming: ConsoleEvent[]
  today: TodayReservation[]
  /** userId → email, for guest names. `profiles` is own-row RLS, so this
   *  only arrives via the owner-scoped RPC. */
  contacts: Map<string, string | null>
  stats: ConsoleStat[]
  series: ConsoleChartSeries
  rangeLabels: string[]
  /** False when the venue has no future bookings at all. */
  hasReservations: boolean
  listingsCount: number
}

function todayKey() {
  return toDayKey(new Date())
}

export function reservationIsTerminal(status: string) {
  return status === 'cancelled' || status === 'rejected' || status === 'completed'
}

/** Covers per day, dense across the window so quiet days read as zero. */
function buildSeries(
  reservations: ReservationRow[],
  days: number,
  earliestLoaded: string,
): ConsoleChartPoint[] {
  const now = new Date()
  const keys: string[] = []
  const buckets = new Map<string, number>()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const key = toDayKey(day)
    // Reservations are only fetched from today forward, so days before the
    // window's own start may have no data to bucket against — zero is right.
    if (key < earliestLoaded) continue
    keys.push(key)
    buckets.set(key, 0)
  }

  for (const reservation of reservations) {
    // `reservation_date` is a `date` column: a bare YYYY-MM-DD with no
    // timezone to shift, so it is safe to use as a map key directly.
    if (!buckets.has(reservation.reservation_date)) continue
    buckets.set(
      reservation.reservation_date,
      (buckets.get(reservation.reservation_date) ?? 0) + (Number(reservation.guest_count) || 0),
    )
  }

  return keys.map((key) => ({ label: formatDayLabel(key), value: buckets.get(key) ?? 0 }))
}

export async function getRestaurantDashboard(
  supabase: SupabaseClient,
  user: UserLike,
): Promise<RestaurantDashboardData> {
  const { data: businessRaw } = await supabase
    .from('businesses')
    .select('id,name')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Self-heal accounts provisioned before the callback fix.
  const metaRole = (user.user_metadata?.role as string | undefined) ?? null
  let business = (businessRaw as BusinessRow | null) ?? null
  if (!business && metaRole === 'food_business') {
    business = await ensureBusiness(supabase, user)
  }

  if (!business) {
    return {
      business: null,
      branches: [],
      calendar: [],
      upcoming: [],
      today: [],
      contacts: new Map(),
      stats: [],
      series: {},
      rangeLabels: [],
      hasReservations: false,
      listingsCount: 0,
    }
  }

  const { data: branchRows } = await supabase
    .from('branches')
    .select('id,branch_name')
    .eq('business_id', business.id)

  const branches = ((branchRows ?? []) as Array<{ id: string; branch_name: string }>).map((b) => ({
    id: b.id,
    name: b.branch_name,
  }))
  const branchIds = branches.map((b) => b.id)
  const branchNameById = new Map(branches.map((b) => [b.id, b.name]))

  const [listingsRes, menuRes] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id,cover_url,logo_url')
      .eq('business_id', business.id)
      .eq('is_active', true),
    branchIds.length
      ? supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .in('branch_id', branchIds)
      : Promise.resolve({ count: 0 }),
  ])

  // One row per listing, so counting client-side beats a second round trip.
  const listings = (listingsRes.data ?? []) as Array<{
    id: string
    cover_url: string | null
    logo_url: string | null
  }>
  // A listing photo is the best available thumbnail for a reservation row.
  const coverImage =
    listings.find((c) => c.cover_url)?.cover_url ??
    listings.find((c) => c.logo_url)?.logo_url ??
    null

  const today = todayKey()

  const reservationsRes = branchIds.length
    ? await supabase
        .from('reservations')
        .select('id,branch_id,user_id,reservation_date,time_slot,guest_count,status')
        .in('branch_id', branchIds)
        .gte('reservation_date', today)
        .order('reservation_date', { ascending: true })
        .limit(RESERVATION_LIMIT)
    : { data: [] as ReservationRow[] }

  const reservations = (reservationsRes.data ?? []) as ReservationRow[]

  function toConsoleEvent(row: ReservationRow): ConsoleEvent {
    const guests = Number(row.guest_count) || 0
    return {
      id: row.id,
      name: `${guests} ${guests === 1 ? 'guest' : 'guests'}`,
      date: row.reservation_date,
      // `time_slot` is free text in Postgres ("7:00 PM"), not a timestamp.
      time: row.time_slot?.trim() || 'Any time',
      venue: branchNameById.get(row.branch_id) ?? 'Branch TBA',
      // `sold` is the console's "positive number beside a green dot". A
      // reservation's meaningful figure is party size; `reservations` has no
      // capacity column, so `capacity` stays undefined and the chip renders
      // "4 guests" rather than a fabricated "4 / 20".
      sold: guests,
      capacity: undefined,
      metricLabel: 'guests',
      tone: toneFor(row.id),
      image: coverImage,
    }
  }

  const dated = reservations.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.reservation_date))
  const calendar = dated.map(toConsoleEvent)

  const openRows = dated
    .filter((row) => OPEN_STATUSES.has(row.status))
    .sort((a, b) =>
      `${a.reservation_date} ${a.time_slot ?? ''}`.localeCompare(
        `${b.reservation_date} ${b.time_slot ?? ''}`,
      ),
    )
  const upcoming = openRows.slice(0, 6).map(toConsoleEvent)

  const todayRows = dated
    .filter((row) => row.reservation_date === today)
    .sort((a, b) => (a.time_slot ?? '').localeCompare(b.time_slot ?? ''))

  const todayList: TodayReservation[] = todayRows.map((row) => ({
    id: row.id,
    timeSlot: row.time_slot,
    guestCount: Number(row.guest_count) || 0,
    status: row.status,
    userId: row.user_id,
  }))

  const contacts = new Map<string, string | null>()
  const contactIds = Array.from(new Set(todayList.map((r) => r.userId).filter(Boolean))) as string[]
  if (contactIds.length > 0) {
    const { data: contactRows } = await supabase.rpc('partner_customer_contacts', {
      p_user_ids: contactIds,
    })
    for (const contact of (contactRows ?? []) as Array<{ id: string; email: string | null }>) {
      contacts.set(contact.id, contact.email)
    }
  }

  const listingsCount = listings.length
  const menuCount = (menuRes.count as number) ?? 0
  const coversUpcoming = openRows.reduce((sum, row) => sum + (Number(row.guest_count) || 0), 0)

  const rangeLabels = CHART_RANGES.map((d) => `${d} days`)
  const series: ConsoleChartSeries = {}
  CHART_RANGES.forEach((days, index) => {
    series[rangeLabels[index]] = buildSeries(reservations, days, today)
  })

  const stats: ConsoleStat[] = [
    {
      label: 'Reservations Today',
      value: formatThousands(todayRows.length),
      subtext: pluralize(coversUpcoming, 'cover') + ' upcoming',
      icon: 'calendar',
      tone: 'indigo',
    },
    {
      label: 'Covers Upcoming',
      value: formatThousands(coversUpcoming),
      subtext: pluralize(openRows.length, 'open booking'),
      icon: 'attendees',
      tone: 'mint',
    },
    {
      label: 'Published Listings',
      value: formatThousands(listingsCount),
      subtext: 'Live on Explore',
      icon: 'revenue',
      tone: 'sand',
    },
    {
      label: 'Menu Items',
      value: formatThousands(menuCount),
      subtext: pluralize(branches.length, 'branch', 'branches'),
      icon: 'ticket',
      tone: 'blush',
    },
  ]

  return {
    business,
    branches,
    calendar,
    upcoming,
    today: todayList,
    contacts,
    stats,
    series,
    rangeLabels,
    hasReservations: reservations.length > 0,
    listingsCount,
  }
}