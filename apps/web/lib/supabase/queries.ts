import { createClient } from '@/lib/supabase/server'

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
    .select('id, name, cuisine, logo_url, cover_url, is_verified, opening_hours, business_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !restaurant) return null

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

  if (error || !event) return null

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

  const { data } = await supabase
    .from('reservations')
    .select(
      'id, reservation_date, time_slot, guest_count, status, branch:branches(branch_name, address, restaurant:restaurants(name))'
    )
    .eq('user_id', userId)
    .order('reservation_date', { ascending: false })
    .limit(50)

  if (!data) return []

  return (data as any[]).map((r) => {
    const branch = Array.isArray(r.branch) ? r.branch[0] : r.branch
    const restaurant = branch?.restaurant
      ? Array.isArray(branch.restaurant)
        ? branch.restaurant[0]
        : branch.restaurant
      : null
    return {
      id: r.id,
      reservationDate: r.reservation_date,
      timeSlot: r.time_slot,
      guestCount: r.guest_count,
      status: r.status,
      branchName: branch?.branch_name ?? '',
      address: branch?.address ?? '',
      restaurantName: restaurant?.name ?? '',
    }
  })
}
