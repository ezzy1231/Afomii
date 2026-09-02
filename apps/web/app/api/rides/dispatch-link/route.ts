import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Ride dispatch-link generator.
 *
 * Ported from apps/backend/src/modules/rides/rides.service.ts generateDispatchLink.
 * Creates deep-links for Uber, Yango, Lyft, Feres, with a Google Maps web
 * fallback when no scheme matches.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerName, pickupLat, pickupLng, dropoffLat, dropoffLng } = body as {
      providerName: string
      pickupLat: number
      pickupLng: number
      dropoffLat: number
      dropoffLng: number
    }

    if (!providerName || !pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const pickup = `${pickupLat},${pickupLng}`
    const dropoff = `${dropoffLat},${dropoffLng}`

    const schemes: Record<string, string> = {
      uber: `uber://?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLng}`,
      yango: `yango://route?start=${pickup}&end=${dropoff}`,
      lyft: `lyft://ridetype?id=lyft&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&destination[latitude]=${dropoffLat}&destination[longitude]=${dropoffLng}`,
      feres: `feres://navigate?start=${pickup}&end=${dropoff}`,
    }

    const key = providerName.toLowerCase().split(' ')[0]
    const deepLink = schemes[key] ?? null
    const webFallback = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}`

    return NextResponse.json({ providerName, deepLink, webFallback })
  } catch {
    return NextResponse.json({ error: 'Could not generate dispatch link.' }, { status: 500 })
  }
}
