const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export type CatalogueItem = {
  id: string
  name: string
  category: string
  location: string
  detail: string
  rating: string
  color: string
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
  { id: '1', name: 'Juniper Table', category: 'Modern African', location: 'West End', detail: 'Open until 11:00 PM', rating: '4.9', color: 'bg-orange-100 text-orange-800' },
  { id: '2', name: 'Sora Noodle House', category: 'Japanese', location: 'Central Market', detail: 'Open until 10:30 PM', rating: '4.8', color: 'bg-rose-100 text-rose-800' },
  { id: '3', name: 'Olive & Grain', category: 'Mediterranean', location: 'Riverside', detail: 'Open until 10:00 PM', rating: '4.7', color: 'bg-emerald-100 text-emerald-800' },
  { id: '4', name: 'Koru Coffee', category: 'Cafe', location: 'Old Town', detail: 'Open until 8:00 PM', rating: '4.8', color: 'bg-amber-100 text-amber-800' },
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

export async function getRestaurantCatalogue(): Promise<{ items: CatalogueItem[]; source: 'live' | 'sample' }> {
  try {
    const response = await fetch(`${API_BASE}/partners/restaurants`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return { items: fallbackRestaurants, source: 'sample' }
    }

    const data = await response.json()

    if (!data.length) {
      return { items: fallbackRestaurants, source: 'sample' }
    }

    const items: CatalogueItem[] = data.map((business: any) => ({
      id: business.id,
      name: business.name,
      category: business.category ?? 'Restaurant',
      location: business.branches?.[0]?.address ?? 'City center',
      detail: business.isVerified ? 'Verified' : 'Open today',
      rating: business.isVerified ? '4.8' : 'New',
      color: chooseColor(business.name, restaurantColors),
    }))

    return { items, source: 'live' }
  } catch {
    return { items: fallbackRestaurants, source: 'sample' }
  }
}

export async function getEventCatalogue(): Promise<{ items: CatalogueItem[]; source: 'live' | 'sample' }> {
  try {
    const response = await fetch(`${API_BASE}/events`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return { items: fallbackEvents, source: 'sample' }
    }

    const data = await response.json()

    if (!data.length) {
      return { items: fallbackEvents, source: 'sample' }
    }

    const items: CatalogueItem[] = data.map((event: any) => ({
      id: event.id,
      name: event.title,
      category: event.category ?? 'Event',
      location: event.venueName ?? 'City venue',
      detail: formatEventTime(event.startDateTime),
      rating: event.ticketTypes?.[0]
        ? `From $${event.ticketTypes[0].price}`
        : 'Free',
      color: chooseColor(event.title, eventColors),
    }))

    return { items, source: 'live' }
  } catch {
    return { items: fallbackEvents, source: 'sample' }
  }
}
