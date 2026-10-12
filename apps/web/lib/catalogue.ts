import { unstable_cache } from 'next/cache'
import { createAnonClient } from '@/lib/supabase/anon'
import { organizerIsPublic } from '@/lib/dashboard/organizer-data'

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
  /**
   * Whether the owning business/organizer passed moderation.
   *
   * Every consumer page reads through the anon client, and both
   * restaurants_select_anon and events_select_anon gate on the *parent* being
   * active + verified — so anything in this list is verified by construction.
   * Kept explicit so cards can say so rather than implying it.
   */
  isVerified?: boolean
}

/**
 * PostgREST returns a to-one embed as an object, but as an array when the
 * relationship cannot be proven unique. Normalise both.
 */
function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

const restaurantColors = [
  'bg-blue-100 text-blue-800',
  'bg-rose-100 text-rose-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
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



/**
 * Cached public catalogue reads (60s TTL). The navbar's session check still
 * makes pages dynamic, but the catalogue rows themselves are shared across
 * every visitor for a minute — cutting per-request Supabase round-trips on
 * the home, /restaurants and /events pages.
 */
const CATALOGUE_TTL_SECONDS = 60

const fetchRestaurantCatalogue = unstable_cache(
  async (): Promise<{ items: CatalogueItem[] }> => {
    // Anonymous client: public catalogue reads must not depend on request
    // cookies, so the result is cacheable across users. RLS exposes only
    // published rows to this role.
    //
    // No `businesses!inner(...)` here. businesses_select is `to authenticated`
    // only, so PostgREST cannot read the parent row as anon and the join made
    // this query return [] for every restaurant — the catalogue rendered empty
    // even with a verified, active business in the database. restaurants_select_anon
    // already applies private.business_is_public, which requires status active
    // AND is_verified AND owner not suspended, so any row that reaches here is
    // public and isVerified is necessarily true.
    const supabase = createAnonClient()
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, city, area_label, rating, cover_url, closing_label')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(60)

      if (error || !data?.length) {
        if (!error) console.warn('[catalogue] no active restaurants found')
        else console.error('[catalogue] restaurants query failed:', error.message)
        return { items: [] }
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
        // Implied by restaurants_select_anon — see the note above the query.
        isVerified: true,
      }))

      return { items }
    } catch (err) {
      console.error('[catalogue] restaurants catalogue crashed:', err)
      return { items: [] }
    }
  },
  ['restaurant-catalogue'],
  { revalidate: CATALOGUE_TTL_SECONDS, tags: ['restaurant-catalogue'] }
)

export async function getRestaurantCatalogue() {
  return fetchRestaurantCatalogue()
}

const fetchEventCatalogue = unstable_cache(
  async (): Promise<{ items: CatalogueItem[] }> => {
    // See fetchRestaurantCatalogue: anon client keeps public reads cacheable.
    const supabase = createAnonClient()
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, category, venue_name, starts_at, cover_image_url, ticket_types(price), organizer:organizers!inner(status, is_verified)')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('starts_at', { ascending: true })
        .limit(60)

      if (error || !data?.length) {
        if (!error) console.warn('[catalogue] no published events found')
        else console.error('[catalogue] events query failed:', error.message)
        return { items: [] }
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
        isVerified: organizerIsPublic(firstOf(event.organizer)),
      }))

      return { items }
    } catch (err) {
      console.error('[catalogue] events catalogue crashed:', err)
      return { items: [] }
    }
  },
  ['event-catalogue'],
  { revalidate: CATALOGUE_TTL_SECONDS, tags: ['event-catalogue'] }
)

export async function getEventCatalogue() {
  return fetchEventCatalogue()
}
