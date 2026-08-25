import { createClient } from '@/lib/supabase/server'

export type CatalogueItem = {
  id: string
  name: string
  category: string
  location: string
  detail: string
  rating: string
  color: string
  imageUrl?: string | null
  description?: string | null
  startsAt?: string | null
}

const restaurantColors = [
  'bg-orange-100 text-orange-800',
  'bg-rose-100 text-rose-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
]

const eventColors = [
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-stone-100 text-stone-800',
  'bg-lime-100 text-lime-800',
  'bg-violet-100 text-violet-800',
]

function chooseColor(name: string, palette: string[]) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash << 5) - hash + name.charCodeAt(i)
  return palette[Math.abs(hash) % palette.length]
}

export const fallbackRestaurants: CatalogueItem[] = [
  { id: '1', name: 'Juniper Table', category: 'Modern African', location: 'West End', detail: 'Open until 11:00 PM', rating: '4.9', color: 'bg-orange-100 text-orange-800', imageUrl: '/places/food-1.jpg' },
  { id: '2', name: 'Sora Noodle House', category: 'Japanese', location: 'Central Market', detail: 'Open until 10:30 PM', rating: '4.8', color: 'bg-rose-100 text-rose-800', imageUrl: '/places/food-2.jpg' },
  { id: '3', name: 'Olive & Grain', category: 'Mediterranean', location: 'Riverside', detail: 'Open until 10:00 PM', rating: '4.7', color: 'bg-emerald-100 text-emerald-800', imageUrl: '/places/food-3.jpg' },
  { id: '4', name: 'Koru Coffee', category: 'Cafe', location: 'Old Town', detail: 'Open until 8:00 PM', rating: '4.8', color: 'bg-amber-100 text-amber-800', imageUrl: '/places/food-2.jpg' },
]

export const fallbackEvents: CatalogueItem[] = [
  { id: '1', name: 'Night Market Sessions', category: 'Food and music', location: 'Harbour Hall', detail: 'Tonight, 7:00 PM', rating: 'From $12', color: 'bg-fuchsia-100 text-fuchsia-800' },
  { id: '2', name: 'Design After Dark', category: 'Exhibition', location: 'Mori Gallery', detail: 'Friday, 6:30 PM', rating: 'Free', color: 'bg-stone-100 text-stone-800' },
  { id: '3', name: 'City Lights Run', category: 'Wellness', location: 'Riverfront Park', detail: 'Saturday, 5:30 AM', rating: 'From $8', color: 'bg-lime-100 text-lime-800' },
  { id: '4', name: 'The Open Table', category: 'Community', location: 'Noma Commons', detail: 'Sunday, 1:00 PM', rating: 'From $18', color: 'bg-violet-100 text-violet-800' },
]

function formatEventTime(value: string | null) {
  if (!value) return 'Date TBA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBA'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// Sample listings must never ship to production (see PRODUCTION_READINESS_PLAN
// M0): they exist only so local development has content before seeding Supabase.
const SAMPLE_DATA_ENABLED = process.env.NODE_ENV !== 'production'

export async function getRestaurantCatalogue(): Promise<{ items: CatalogueItem[]; source: 'live' | 'sample' }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, cuisine, city, area_label, rating, cover_url, closing_label')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(60)

    if (error || !data?.length) {
      if (!error) console.warn('[catalogue] no active restaurants found')
      else console.error('[catalogue] restaurants query failed:', error.message)
      return SAMPLE_DATA_ENABLED
        ? { items: fallbackRestaurants, source: 'sample' }
        : { items: [], source: 'live' }
    }

    const items: CatalogueItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.cuisine ?? 'Restaurant',
      location: r.area_label ?? r.city ?? 'City center',
      // Rating renders next to the card title already — use this line for
      // hours info ("Open until …") instead of duplicating the star rating.
      detail: r.closing_label ?? 'Open today',
      rating: r.rating != null ? String(r.rating) : 'New',
      color: chooseColor(r.name, restaurantColors),
      imageUrl: r.cover_url ?? null,
    }))

    return { items, source: 'live' }
  } catch (err) {
    console.error('[catalogue] restaurants catalogue crashed:', err)
    return SAMPLE_DATA_ENABLED
      ? { items: fallbackRestaurants, source: 'sample' }
      : { items: [], source: 'live' }
  }
}

export async function getEventCatalogue(): Promise<{ items: CatalogueItem[]; source: 'live' | 'sample' }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, category, venue_name, starts_at, cover_image_url, ticket_types(price)')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('starts_at', { ascending: true })
      .limit(60)

    if (error || !data?.length) {
      if (!error) console.warn('[catalogue] no published events found')
      else console.error('[catalogue] events query failed:', error.message)
      return SAMPLE_DATA_ENABLED
        ? { items: fallbackEvents, source: 'sample' }
        : { items: [], source: 'live' }
    }

    const items: CatalogueItem[] = data.map((event: any) => ({
      id: event.id,
      name: event.title,
      category: event.category ?? 'Event',
      location: event.venue_name ?? 'City venue',
      detail: formatEventTime(event.starts_at),
      rating: event.ticket_types?.[0]
        ? `From ETB ${event.ticket_types[0].price}`
        : 'Free',
      color: chooseColor(event.title, eventColors),
      imageUrl: event.cover_image_url ?? null,
      description: event.description ?? null,
      startsAt: event.starts_at ?? null,
    }))

    return { items, source: 'live' }
  } catch (err) {
    console.error('[catalogue] events catalogue crashed:', err)
    return SAMPLE_DATA_ENABLED
      ? { items: fallbackEvents, source: 'sample' }
      : { items: [], source: 'live' }
  }
}
