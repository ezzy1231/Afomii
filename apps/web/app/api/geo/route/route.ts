import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * OSRM routing proxy with Haversine fallback.
 *
 * Endpoint: GET /api/geo/route?fromLat=&fromLng=&toLat=&toLng=
 *
 * Override the OSRM endpoint with OSRM_BASE_URL (e.g. a self-hosted instance).
 * The public demo (router.project-osrm.org) is rate-limited — self-host for
 * production.
 */

const OSRM_BASE = (process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org').replace(/\/$/, '')

/**
 * Haversine great-circle distance between two lat/lng points in km.
 * Used as a fallback when OSRM is unreachable.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams
  const fromLat = Number(p.get('fromLat'))
  const fromLng = Number(p.get('fromLng'))
  const toLat = Number(p.get('toLat'))
  const toLng = Number(p.get('toLng'))

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Missing required params: fromLat, fromLng, toLat, toLng' }, { status: 400 })
  }
  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    return NextResponse.json({ error: 'Coordinates must be numbers.' }, { status: 400 })
  }

  // Try OSRM first with ~8 s timeout.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  try {
    const url =
      `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'UrbanExplore/1.0' },
      signal: controller.signal,
      next: { revalidate: 120 },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      // Fallback on OSRM error
      return fallbackResponse(fromLat, fromLng, toLat, toLng)
    }

    const data = (await res.json()) as {
      code?: string
      routes?: Array<{ distance: number; duration: number; geometry: { coordinates: [number, number][] } }>
    }
    if (data.code !== 'Ok' || !data.routes?.length) {
      return fallbackResponse(fromLat, fromLng, toLat, toLng)
    }

    const route = data.routes[0]
    return NextResponse.json({
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMin: Math.round(route.duration / 60),
      source: 'osrm',
      geometry: route.geometry.coordinates,
    })
  } catch {
    clearTimeout(timeout)
    return fallbackResponse(fromLat, fromLng, toLat, toLng)
  }
}

function fallbackResponse(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const distanceKm = Math.round(haversineKm(fromLat, fromLng, toLat, toLng) * 100) / 100
  // Estimate duration at ~25 km/h city driving speed (Addis traffic).
  const durationMin = Math.round(distanceKm * 2.4) // 60 min / 25 km ≈ 2.4 min/km
  return NextResponse.json({
    distanceKm: Math.max(distanceKm, 0.5),
    durationMin: Math.max(1, durationMin),
    source: 'haversine',
    geometry: null,
    note: 'Distance is a straight-line estimate and may differ from the actual road distance.',
  })
}
