import type { MetadataRoute } from 'next'
import { createAnonClient } from '@/lib/supabase/anon'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600 // regenerate the sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/restaurants`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/events`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/ride`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/about`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/vision`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const [restaurantEntries, eventEntries, organizerEntries] = await Promise.all([
    listRestaurantUrls(),
    listEventUrls(),
    listOrganizerUrls(),
  ])

  return [...staticEntries, ...restaurantEntries, ...eventEntries, ...organizerEntries]
}

/** Public listings — must not 500 when the DB is empty or unreachable. */
async function listRestaurantUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error || !data) return []
    return data.map((r) => ({
      url: `${getSiteUrl()}/restaurants/${r.id}`,
      lastModified: (r as any).updated_at ? new Date((r as any).updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('[sitemap] restaurants query failed:', err)
    return []
  }
}

async function listEventUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, updated_at')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('starts_at', { ascending: true })
      .limit(500)

    if (error || !data) return []
    return data.map((e) => ({
      url: `${getSiteUrl()}/events/${e.id}`,
      lastModified: (e as any).updated_at ? new Date((e as any).updated_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (err) {
    console.error('[sitemap] events query failed:', err)
    return []
  }
}

async function listOrganizerUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createAnonClient()
    // organizers with at least one published event — public profiles only
    const { data, error } = await supabase
      .from('events')
      .select('organizer_id, updated_at')
      .eq('status', 'published')
      .limit(500)

    if (error || !data) return []
    const seen = new Set<string>()
    const entries: MetadataRoute.Sitemap = []
    for (const row of data) {
      const orgId = (row as any).organizer_id
      if (!orgId || seen.has(orgId)) continue
      seen.add(orgId)
      entries.push({
        url: `${getSiteUrl()}/organizers/${orgId}`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      })
    }
    return entries
  } catch (err) {
    console.error('[sitemap] organizers query failed:', err)
    return []
  }
}
