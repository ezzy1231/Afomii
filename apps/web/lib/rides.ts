/**
 * Shared ride-fare math (meter-taxi rate rules) used by the ride planner and
 * the My Plans ride-book flow. Local ETB estimates — no external pricing API.
 */

export type RideOption = {
  providerName: string
  providerLogo?: string
  tier: string
  estimatedPrice: { amount: number; currency: string }
  etaMinutes: number
  badge?: string
}

export type RouteInfo = {
  distanceKm: number
  durationMin: number
  source: 'osrm' | 'haversine'
  geometry: [number, number][] | null
}

export type LatLng = { lat: number; lng: number }

export function roundBirr(amount: number) {
  return Math.round(amount)
}

/**
 * Haversine great-circle distance between two lat/lng points in km.
 * Straight-line estimate — used when the OSRM routing service is unavailable.
 */
export function haversineKm(from: LatLng, to: LatLng): number {
  const R = 6371
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Build the three meter-taxi fare rows for a trip of the given km. */
export function buildMeterTaxiEstimates(distanceKm: number): RideOption[] {
  const normalizedDistance = Math.max(distanceKm, 0.5)

  return [
    {
      providerName: 'Meter Taxi',
      tier: 'Standard',
      estimatedPrice: { amount: roundBirr(90 + normalizedDistance * 18), currency: 'ETB' },
      etaMinutes: Math.max(5, Math.round(normalizedDistance * 3 + 4)),
      badge: 'Best Value',
    },
    {
      providerName: 'Meter Taxi',
      tier: 'Comfort',
      estimatedPrice: { amount: roundBirr(110 + normalizedDistance * 22), currency: 'ETB' },
      etaMinutes: Math.max(4, Math.round(normalizedDistance * 2.5 + 4)),
      badge: undefined,
    },
    {
      providerName: 'Meter Taxi',
      tier: 'Minivan',
      estimatedPrice: { amount: roundBirr(140 + normalizedDistance * 28), currency: 'ETB' },
      etaMinutes: Math.max(4, Math.round(normalizedDistance * 2.2 + 3)),
      badge: 'Fastest',
    },
  ]
}

/** Fetch the routed trip info from the OSRM proxy with a Haversine fallback. */
export async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteInfo> {
  const qs = new URLSearchParams({
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
  })
  const res = await fetch(`/api/geo/route?${qs.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Routing service is unavailable.')
  const data = (await res.json()) as RouteInfo & { error?: string }
  if (data.error) throw new Error(data.error)
  return {
    distanceKm: data.distanceKm,
    durationMin: data.durationMin,
    source: data.source,
    geometry: data.geometry,
  }
}
