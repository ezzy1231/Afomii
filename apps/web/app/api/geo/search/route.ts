import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Nominatim place-search proxy.
 *
 * Proxying server-side lets us send a proper User-Agent/Referer (required by
 * Nominatim's usage policy), keep the API key out of the browser, and add a
 * tiny in-memory cache so repeated queries (typing) don't hammer the service.
 * Override the endpoint with NOMINATIM_BASE_URL (e.g. a self-hosted instance).
 */

const NOMINATIM_BASE = (process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org').replace(/\/$/, '')
const CACHE_TTL_MS = 60_000

type SearchResult = {
  label: string
  lat: number
  lng: number
  type: string
}

const cache = new Map<string, { at: number; results: SearchResult[] }>()

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  const cached = cache.get(q)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ results: cached.results })
  }

  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '6',
    addressdetails: '1',
    'accept-language': 'en',
    // Bias toward Addis Ababa while still returning global results.
    viewbox: '38.56,9.16,38.94,8.86',
    bounded: '0',
  })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        'User-Agent': 'UrbanExplore/1.0 (AddisAbaba ride planner; contact: hello@urbanexplore.et)',
        Referer: process.env.NEXT_PUBLIC_MAIN_ORIGIN ?? request.headers.get('origin') ?? 'https://urbanexplore.et',
        'Accept-Language': 'en',
      },
      signal: controller.signal,
      next: { revalidate: 60 },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: 'Address search is unavailable right now.' },
        { status: 502 }
      )
    }

    const data = (await res.json()) as Array<{
      display_name: string
      lat: string
      lon: string
      type?: string
      addresstype?: string
    }>

    const results: SearchResult[] = (data ?? []).map((item) => ({
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      type: item.addresstype ?? item.type ?? 'place',
    }))

    cache.set(q, { at: Date.now(), results })
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json(
      { results: [], error: 'Address search timed out. Please try again.' },
      { status: 504 }
    )
  }
}
