import { createClient } from '@/lib/supabase/server'
import { fallbackRestaurants, fallbackEvents, type CatalogueItem } from '@/lib/catalogue'

// Sample-detail builders must never serve fake menus/prices in production.
const SAMPLE_DETAIL_DATA = process.env.NODE_ENV !== 'production'

export type DetailBranch = {
  id: string
  branchName: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  bookingConfig: {
    bookingMode: string
    totalTables: number
    maxGuestPerTable: number
    slotDurationMinutes: number
    advanceNoticeHours: number
    cancellationPolicy: string | null
  } | null
  menuItems: {
    id: string
    name: string
    price: number
    category: string
    isAvailable: boolean
  }[]
}

export type RestaurantDetail = {
  id: string
  name: string
  category: string
  logoUrl: string | null
  coverUrl: string | null
  isVerified: boolean
  rating: number | null
  openingHours: Record<string, { open: string; close: string }[]> | null
  branches: DetailBranch[]
}

export type DetailTicketType = {
  id: string
  name: string
  tier: string
  price: number
  totalQuantity: number
  remainingQuantity: number
  salesStart: string | null
  salesEnd: string | null
}

export type EventDetail = {
  id: string
  title: string
  description: string | null
  category: string
  venueName: string
  latitude: number | null
  longitude: number | null
  startDateTime: string
  endDateTime: string
  coverImageUrl: string | null
  status: string
  ticketTypes: DetailTicketType[]
  organizer: { id: string; email: string }
}

export async function getRestaurantDetail(id: string): Promise<RestaurantDetail | null> {
  const supabase = await createClient()

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, cuisine, logo_url, cover_url, is_verified, rating, opening_hours, business_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !restaurant) {
    console.error('[queries] restaurant detail unavailable:', error?.message ?? 'not found')
    if (SAMPLE_DETAIL_DATA) {
      const sample = fallbackRestaurants.find((r) => r.id === id)
      return sample ? buildSampleRestaurantDetail(sample) : null
    }
    return null
  }

  const { data: branches } = await supabase
    .from('branches')
    .select(
      'id, branch_name, address, latitude, longitude, phone, booking_configs(booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours, cancellation_policy), menu_items(id, name, price, category, is_available)'
    )
    .eq('business_id', restaurant.business_id)
    .order('created_at', { ascending: true })

  const mappedBranches: DetailBranch[] = (branches ?? []).map((b: any) => ({
    id: b.id,
    branchName: b.branch_name,
    address: b.address ?? '',
    latitude: b.latitude,
    longitude: b.longitude,
    phone: b.phone,
    bookingConfig: (() => {
      const bc = Array.isArray(b.booking_configs) ? b.booking_configs[0] : b.booking_configs
      return bc
        ? {
            bookingMode: bc.booking_mode,
            totalTables: bc.total_tables,
            maxGuestPerTable: bc.max_guest_per_table,
            slotDurationMinutes: bc.slot_duration_minutes ?? 30,
            advanceNoticeHours: bc.advance_notice_hours ?? 0,
            cancellationPolicy: bc.cancellation_policy ?? null,
          }
        : null
    })(),
    menuItems: (b.menu_items ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      price: Number(m.price),
      category: m.category,
      isAvailable: m.is_available,
    })),
  }))

  return {
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.cuisine ?? '',
    logoUrl: restaurant.logo_url,
    coverUrl: restaurant.cover_url,
    isVerified: restaurant.is_verified,
    rating: restaurant.rating,
    openingHours: restaurant.opening_hours,
    branches: mappedBranches,
  }
}

export async function getEventDetail(id: string): Promise<EventDetail | null> {
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, title, description, category, venue_name, latitude, longitude, starts_at, end_date_time, cover_image_url, status, organizer:organizers(id, email)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !event) {
    console.error('[queries] event detail unavailable:', error?.message ?? 'not found')
    if (SAMPLE_DETAIL_DATA) {
      const sample = fallbackEvents.find((e) => e.id === id)
      return sample ? buildSampleEventDetail(sample) : null
    }
    return null
  }

  const { data: ticketTypes } = await supabase
    .from('ticket_types')
    .select('id, name, tier, price, total_quantity, remaining_quantity, sales_start, sales_end')
    .eq('event_id', id)
    .order('price', { ascending: true })

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category ?? '',
    venueName: event.venue_name ?? '',
    latitude: event.latitude,
    longitude: event.longitude,
    startDateTime: event.starts_at ?? '',
    endDateTime: event.end_date_time ?? '',
    coverImageUrl: event.cover_image_url,
    status: event.status,
    ticketTypes: (ticketTypes ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      tier: t.tier,
      price: Number(t.price),
      totalQuantity: t.total_quantity,
      remainingQuantity: t.remaining_quantity,
      salesStart: t.sales_start,
      salesEnd: t.sales_end,
    })),
    organizer: (() => {
      const org = Array.isArray(event.organizer) ? event.organizer[0] : event.organizer
      return {
        id: org?.id ?? '',
        email: org?.email ?? '',
      }
    })(),
  }
}

export type ConsumerReservation = {
  id: string
  reservationDate: string
  timeSlot: string | null
  guestCount: number
  status: string
  branchName: string
  address: string
  restaurantName: string
}

export async function getConsumerReservations(userId: string): Promise<ConsumerReservation[]> {
  const supabase = await createClient()

  // Step 1: fetch reservations with branch info (branches FK is valid)
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(
      'id, reservation_date, time_slot, guest_count, status, branch:branches(branch_name, address, business_id)'
    )
    .eq('user_id', userId)
    .order('reservation_date', { ascending: false })
    .limit(50)

  if (error || !reservations) {
    console.error('[queries] getConsumerReservations error:', error?.message)
    return []
  }

  // Step 2: collect unique business_ids from branches
  const businessIds = [
    ...new Set(
      (reservations as any[]).map((r) => {
        const branch = Array.isArray(r.branch) ? r.branch[0] : r.branch
        return branch?.business_id
      }).filter(Boolean),
    ),
  ]

  // Step 3: fetch restaurant names by business_id
  // (restaurants_select_anon allows is_active=true reads for authenticated)
  const restaurantMap = new Map<string, string>()
  if (businessIds.length > 0) {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('business_id, name')
      .in('business_id', businessIds)
    for (const r of restaurants ?? []) {
      if (!restaurantMap.has(r.business_id)) {
        restaurantMap.set(r.business_id, r.name)
      }
    }
  }

  // Step 4: map to ConsumerReservation
  return (reservations as any[]).map((r) => {
    const branch = Array.isArray(r.branch) ? r.branch[0] : r.branch
    return {
      id: r.id,
      reservationDate: r.reservation_date,
      timeSlot: r.time_slot,
      guestCount: r.guest_count,
      status: r.status,
      branchName: branch?.branch_name ?? '',
      address: branch?.address ?? '',
      restaurantName: branch?.business_id ? (restaurantMap.get(branch.business_id) ?? '') : '',
    }
  })
}

export type ConsumerTicket = {
  id: string
  ticketTypeId: string
  eventId: string
  eventTitle: string
  ticketName: string
  quantity: number
  amount: number
  paymentStatus: string
  qrCode: string | null
  attended: boolean
  createdAt: string
}

export async function getConsumerTickets(userId: string): Promise<ConsumerTicket[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ticket_purchases')
    .select(
      'id, ticket_type_id, event_id, quantity, amount, payment_status, qr_code, attended, created_at, ticket_types(name), events(title)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) {
    console.error('[queries] getConsumerTickets error:', error?.message)
    return []
  }

  return (data as any[]).map((r) => {
    const tt = Array.isArray(r.ticket_types) ? r.ticket_types[0] : r.ticket_types
    const ev = Array.isArray(r.events) ? r.events[0] : r.events
    return {
      id: r.id,
      ticketTypeId: r.ticket_type_id,
      eventId: r.event_id ?? '',
      eventTitle: ev?.title ?? '',
      ticketName: tt?.name ?? '',
      quantity: r.quantity,
      amount: Number(r.amount) || 0,
      paymentStatus: r.payment_status,
      qrCode: r.qr_code ?? null,
      attended: r.attended,
      createdAt: r.created_at,
    }
  })
}

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function buildSampleRestaurantDetail(item: CatalogueItem): RestaurantDetail {
  const hours = ALL_DAYS.reduce(
    (acc, day) => ({ ...acc, [day]: [{ open: '11:00', close: '22:00' }] }),
    {}
  )

  const menuByCuisine: Record<string, { name: string; price: number; category: string }[]> = {
    default: [
      { name: 'Signature platter', price: 450, category: 'Main Course' },
      { name: 'Seasonal soup', price: 180, category: 'Soup & Salad' },
      { name: 'Garden salad', price: 160, category: 'Soup & Salad' },
      { name: 'Grilled specialty', price: 520, category: 'Main Course' },
      { name: 'Fried appetizer mix', price: 220, category: 'Appetizers' },
      { name: 'Fresh juice', price: 90, category: 'Drinks' },
    ],
  }

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    logoUrl: null,
    coverUrl: item.imageUrl ?? null,
    isVerified: true,
    rating: Number(item.rating) || null,
    openingHours: hours,
    branches: [
      {
        id: `${item.id}-branch-1`,
        branchName: `${item.name} — ${item.location}`,
        address: item.location,
        latitude: null,
        longitude: null,
        phone: null,
        bookingConfig: {
          bookingMode: 'instant',
          totalTables: 10,
          maxGuestPerTable: 6,
          slotDurationMinutes: 60,
          advanceNoticeHours: 0,
          cancellationPolicy: 'Free cancellation up to 2 hours before your reservation.',
        },
        menuItems: (menuByCuisine[item.category] ?? menuByCuisine.default).map((m, i) => ({
          id: `${item.id}-menu-${i}`,
          name: m.name,
          price: m.price,
          category: m.category,
          isAvailable: true,
        })),
      },
    ],
  }
}

function nextOccurrence(detail: string): Date {
  const timeMatch = detail.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  let hour = 19
  let minute = 0
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10) % 12
    if (timeMatch[3].toUpperCase() === 'PM') hour += 12
    minute = parseInt(timeMatch[2], 10)
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const lowered = detail.toLowerCase()
  const now = new Date()
  const result = new Date()
  result.setHours(hour, minute, 0, 0)

  const dayIndex = dayNames.findIndex((d) => lowered.includes(d))
  if (dayIndex >= 0) {
    const diff = (dayIndex - now.getDay() + 7) % 7
    result.setDate(now.getDate() + (diff === 0 && result <= now ? 7 : diff))
  } else if (result <= now) {
    result.setDate(now.getDate() + 2)
  }

  return result
}

export type OrganizerEvent = {
  id: string
  title: string
  category: string
  venueName: string
  startDateTime: string
  coverImageUrl: string | null
  status: string
  priceFrom: number | null
}

export type OrganizerDetail = {
  id: string
  name: string
  bio: string | null
  logoUrl: string | null
  coverUrl: string | null
  isVerified: boolean
  city: string
  followerCount: number
  rating: string | null
  events: OrganizerEvent[]
}

export async function getOrganizerDetail(id: string): Promise<OrganizerDetail | null> {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizers')
    .select('id, name, description, is_verified')
    .eq('id', id)
    .maybeSingle()

  if (error || !org) {
    console.error('[queries] organizer detail unavailable:', error?.message ?? 'not found')
    if (SAMPLE_DETAIL_DATA) {
      const sample = fallbackOrganizers.find((o) => o.id === id)
      return sample ?? null
    }
    return null
  }

  const [{ data: events }, { count: followers }] = await Promise.all([
    supabase
      .from('events')
      .select(
        'id, title, category, venue_name, starts_at, end_date_time, cover_image_url, status, ticket_types(price)'
      )
      .eq('organizer_id', id)
      .eq('status', 'published')
      .order('starts_at', { ascending: true }),
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', id),
  ])

  const mappedEvents: OrganizerEvent[] = (events ?? []).map((e: any) => {
    const prices = (e.ticket_types ?? [])
      .map((t: any) => Number(t.price))
      .filter((n: number) => !Number.isNaN(n))
    return {
      id: e.id,
      title: e.title,
      category: e.category ?? '',
      venueName: e.venue_name ?? '',
      startDateTime: e.starts_at ?? '',
      coverImageUrl: e.cover_image_url ?? null,
      status: e.status,
      priceFrom: prices.length ? Math.min(...prices) : null,
    }
  })

  return {
    id: org.id,
    name: org.name,
    bio: org.description ?? null,
    logoUrl: null,
    coverUrl: null,
    isVerified: org.is_verified ?? false,
    city: 'Addis Ababa',
    followerCount: followers ?? 0,
    rating: null,
    events: mappedEvents,
  }
}

const fallbackOrganizers: OrganizerDetail[] = [
  {
    id: 'sample-organizer',
    name: 'UrbanExplore Presents',
    bio: 'Addis Ababa’s resident curators of food, music and after-dark culture. We stage the city’s most-talked-about nights — and the quiet ones worth leaving the house for.',
    logoUrl: null,
    coverUrl: null,
    isVerified: true,
    city: 'Addis Ababa',
    followerCount: 12400,
    rating: '4.8',
    events: fallbackEvents.map((e) => {
      const detail = buildSampleEventDetail(e)
      const prices = detail.ticketTypes.map((t) => t.price)
      return {
        id: detail.id,
        title: detail.title,
        category: detail.category,
        venueName: detail.venueName,
        startDateTime: detail.startDateTime,
        coverImageUrl: detail.coverImageUrl,
        status: detail.status,
        priceFrom: prices.length ? Math.min(...prices) : null,
      }
    }),
  },
  {
    id: 'addis-nightlife-collective',
    name: 'Addis Nightlife Collective',
    bio: 'A roaming collective of DJs, chefs and makers. No fixed venue — we turn warehouses, rooftops and galleries into one night only.',
    logoUrl: null,
    coverUrl: null,
    isVerified: true,
    city: 'Addis Ababa',
    followerCount: 8120,
    rating: '4.7',
    events: fallbackEvents
      .filter((e) => ['1', '3', '4'].includes(e.id))
      .map((e) => {
        const detail = buildSampleEventDetail(e)
        const prices = detail.ticketTypes.map((t) => t.price)
        return {
          id: detail.id,
          title: detail.title,
          category: detail.category,
          venueName: detail.venueName,
          startDateTime: detail.startDateTime,
          coverImageUrl: detail.coverImageUrl,
          status: detail.status,
          priceFrom: prices.length ? Math.min(...prices) : null,
        }
      }),
  },
]

function buildSampleEventDetail(item: CatalogueItem): EventDetail {
  const start = nextOccurrence(item.detail)
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)

  return {
    id: item.id,
    title: item.name,
    description: `${item.name} — ${item.category}. Join us for a memorable experience at ${item.location}. Doors open 30 minutes before start.`,
    category: item.category,
    venueName: item.location,
    latitude: null,
    longitude: null,
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    coverImageUrl: null,
    status: 'published',
    ticketTypes: [
      {
        id: `${item.id}-tt-early`,
        name: 'Early Bird',
        tier: 'early_bird',
        price: 350,
        totalQuantity: 50,
        remainingQuantity: 40,
        salesStart: null,
        salesEnd: null,
      },
      {
        id: `${item.id}-tt-general`,
        name: 'General Admission',
        tier: 'general',
        price: 500,
        totalQuantity: 200,
        remainingQuantity: 120,
        salesStart: null,
        salesEnd: null,
      },
      {
        id: `${item.id}-tt-vip`,
        name: 'VIP',
        tier: 'vip',
        price: 1200,
        totalQuantity: 30,
        remainingQuantity: 25,
        salesStart: null,
        salesEnd: null,
      },
    ],
    organizer: { id: 'sample-organizer', email: 'events@urbanexplore.example' },
  }
}
// ── Consumer "My Plans" ────────────────────────────────────────────────────
// Unified view of confirmed reservations + paid ticket purchases for a user.

export type ConsumerPlan = {
  id: string
  planType: 'reservation' | 'event'
  title: string
  coverImageUrl: string | null
  planDate: string | null
  location: string
  latitude: number | null
  longitude: number | null
  status: string
}

export async function getConsumerPlans(userId: string): Promise<ConsumerPlan[]> {
  const supabase = await createClient()

  // ── Reservations (pending/confirmed) ──────────────────────────────────────
  const { data: reservations, error: resErr } = await supabase
    .from('reservations')
    .select('id, reservation_date, time_slot, status, branch:branches!inner(business_id, address, latitude, longitude)')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])

  if (resErr) {
    console.error('[queries] getConsumerPlans (reservations):', resErr.message)
  }

  // ── Restaurant names/cover for each reservation branch ────────────────────
  const businessIds = [...new Set((reservations ?? []).map((r: any) => r.branch?.business_id).filter(Boolean))]
  let restaurantMap: Record<string, { name: string; cover_url: string | null }> = {}
  if (businessIds.length > 0) {
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('business_id, name, cover_url')
      .in('business_id', businessIds)
    if (restaurants) {
      for (const r of restaurants) {
        restaurantMap[r.business_id] = { name: r.name, cover_url: r.cover_url }
      }
    }
  }

  // ── Event ticket purchases (paid) ─────────────────────────────────────────
  const { data: purchases, error: purchErr } = await supabase
    .from('ticket_purchases')
    .select('id, payment_status, event:events!inner(title, cover_image_url, starts_at, venue_name, latitude, longitude)')
    .eq('user_id', userId)
    .eq('payment_status', 'paid')

  if (purchErr) {
    console.error('[queries] getConsumerPlans (ticket_purchases):', purchErr.message)
  }

  // ── Build plans ───────────────────────────────────────────────────────────
  const plans: ConsumerPlan[] = []

  for (const r of (reservations ?? []) as any[]) {
    const branch = r.branch ?? {}
    const biz = branch.business_id as string | undefined
    const rest = biz ? restaurantMap[biz] : undefined
    const planDate = r.reservation_date
      ? `${r.reservation_date}T${r.time_slot || '12:00'}`
      : null
    plans.push({
      id: r.id,
      planType: 'reservation',
      title: rest?.name ?? '',
      coverImageUrl: rest?.cover_url ?? null,
      planDate,
      location: (branch.address as string) ?? '',
      latitude: branch.latitude != null ? Number(branch.latitude) : null,
      longitude: branch.longitude != null ? Number(branch.longitude) : null,
      status: r.status ?? '',
    })
  }

  for (const p of (purchases ?? []) as any[]) {
    const ev = p.event as Record<string, any> | undefined
    plans.push({
      id: p.id,
      planType: 'event',
      title: ev?.title ?? '',
      coverImageUrl: ev?.cover_image_url ?? null,
      planDate: ev?.starts_at ?? null,
      location: ev?.venue_name ?? '',
      latitude: ev?.latitude != null ? Number(ev.latitude) : null,
      longitude: ev?.longitude != null ? Number(ev.longitude) : null,
      status: p.payment_status ?? '',
    })
  }

  plans.sort((a, b) => {
    if (!a.planDate && !b.planDate) return 0
    if (!a.planDate) return 1
    if (!b.planDate) return -1
    return a.planDate.localeCompare(b.planDate)
  })

  return plans
}

export type ConsumerNotification = {
  id: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}

/** Unread notification count for a user (used by the navbar + dashboard bells). */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
  return count ?? 0
}

export async function getConsumerNotifications(userId: string): Promise<ConsumerNotification[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data) return []

  return (data as any[]).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    readAt: n.read_at ?? null,
    createdAt: n.created_at,
  }))
}
