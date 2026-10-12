import { createClient } from '@/lib/supabase/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { businessIsPublic } from '@/lib/dashboard/restaurant-data'
import { organizerIsPublic } from '@/lib/dashboard/organizer-data'

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
    description?: string | null
    price: number
    category: string
    isAvailable: boolean
  }[]
}

export type RestaurantDetail = {
  id: string
  name: string
  category: string
  description: string | null
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
  organizer: { id: string; email: string; isVerified: boolean }
}

export async function getRestaurantDetail(id: string): Promise<RestaurantDetail | null> {
  const supabase = createAnonClient()

  // A restaurant listing is verified when its *business* is, never on a column
  // of its own. restaurants.is_verified was dropped in 0023 because nothing
  // wrote it (only the seed files did) while restaurants_select_anon gates on
  // private.business_is_public(business_id) — so the badge and the gate read
  // different sources and disagreed. businessIsPublic mirrors that function.
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select(
      'id, name, cuisine, description, logo_url, cover_url, rating, opening_hours, business_id, businesses!inner(id, status, is_verified)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !restaurant) {
    console.error('[queries] restaurant detail unavailable:', error?.message ?? 'not found')
    return null
  }

  const business = Array.isArray(restaurant.businesses)
    ? (restaurant.businesses[0] as { id: string; status: string | null; is_verified: boolean | null } | undefined) ?? null
    : (restaurant.businesses as { id: string; status: string | null; is_verified: boolean | null } | null)

  const { data: branches } = await supabase
    .from('branches')
    .select(
      'id, branch_name, address, latitude, longitude, phone, booking_configs(booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours, cancellation_policy), menu_items(id, name, description, price, category, is_available)'
    )
    .eq('business_id', restaurant.business_id)
    // A paused location is hidden from guests but stays editable in the partner
    // console, so this filter belongs here rather than in the RLS policy —
    // `branches_select` is `using (true)` for both roles.
    .eq('is_active', true)
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
      description: m.description,
      price: Number(m.price),
      category: m.category,
      isAvailable: m.is_available,
    })),
  }))

  return {
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.cuisine ?? '',
    description: restaurant.description ?? null,
    logoUrl: restaurant.logo_url,
    coverUrl: restaurant.cover_url,
    isVerified: businessIsPublic(business),
    rating: restaurant.rating,
    openingHours: restaurant.opening_hours,
    branches: mappedBranches,
  }
}

export async function getEventDetail(id: string): Promise<EventDetail | null> {
  const supabase = createAnonClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(
      'id, title, description, category, venue_name, latitude, longitude, starts_at, end_date_time, cover_image_url, status, organizer:organizers(id, email, is_verified, status)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !event) {
    console.error('[queries] event detail unavailable:', error?.message ?? 'not found')
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
        isVerified: organizerIsPublic(
          org ? { status: org.status, is_verified: org.is_verified } : null,
        ),
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
  bookingCode: string
  suggestedTime: string | null
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
      'id, reservation_date, time_slot, guest_count, status, booking_code, suggested_time, branch:branches(branch_name, address, business_id)'
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
      bookingCode: r.booking_code,
      suggestedTime: r.suggested_time,
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
  const publicSupabase = createAnonClient()

  const { data: org, error } = await publicSupabase
    .from('organizers')
    .select('id, name, description, is_verified, logo_url, cover_url, city')
    .eq('id', id)
    .maybeSingle()

  if (error || !org) {
    console.error('[queries] organizer detail unavailable:', error?.message ?? 'not found')
    return null
  }

  const [{ data: events }, { count: followers }] = await Promise.all([
    publicSupabase
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
    logoUrl: org.logo_url ?? null,
    coverUrl: org.cover_url ?? null,
    isVerified: org.is_verified ?? false,
    city: org.city ?? 'Addis Ababa',
    followerCount: followers ?? 0,
    rating: null,
    events: mappedEvents,
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

  /* Reservations and ticket purchases share no dependency — they were
     awaited back-to-back, costing an extra round-trip. Issue both, then do
     the dependent restaurant-name lookup once businessIds are known. */
  const reservationsPromise = supabase
    .from('reservations')
    .select('id, reservation_date, time_slot, status, branch:branches!inner(business_id, address, latitude, longitude)')
    .eq('user_id', userId)
    .in('status', ['pending', 'confirmed'])

  const purchasesPromise = supabase
    .from('ticket_purchases')
    .select('id, payment_status, event:events!inner(title, cover_image_url, starts_at, venue_name, latitude, longitude)')
    .eq('user_id', userId)
    .eq('payment_status', 'paid')

  const [
    { data: reservations, error: resErr },
    { data: purchases, error: purchErr },
  ] = await Promise.all([reservationsPromise, purchasesPromise])

  if (resErr) {
    console.error('[queries] getConsumerPlans (reservations):', resErr.message)
  }
  if (purchErr) {
    console.error('[queries] getConsumerPlans (ticket_purchases):', purchErr.message)
  }

  // ── Restaurant names/cover for each reservation branch ────────────────────
  const businessIds = [...new Set((reservations ?? []).map((r: any) => r.branch?.business_id).filter(Boolean))]
  const restaurantMap: Record<string, { name: string; cover_url: string | null }> = {}
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
