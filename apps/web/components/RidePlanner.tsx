'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowDownUp, CarFront, Check, CheckCircle2, Clock3, MapPin, Navigation } from 'lucide-react'
import { apiRequest } from '@/lib/api'

type RideEstimate = {
  providerName: string
  providerLogo?: string
  tier: string
  estimatedPrice: { amount: number; currency: string }
  etaMinutes: number
  badge?: string
}

type EstimateResponse = {
  pickup: { lat: number; lng: number }
  dropoff: { lat: number; lng: number }
  estimates: RideEstimate[]
  fetchedAt: string
}

type LatLng = { lat: number; lng: number }

declare global {
  interface Window {
    google?: any
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already fully loaded (core + places)
    if (window.google?.maps?.places) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')), { once: true })
      return
    }

    // New bootstrap loader — required for Places API (New)
    const script = document.createElement('script')
    script.dataset.googleMaps = 'true'
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,maps&loading=async`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export default function RidePlanner() {
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [selectedRide, setSelectedRide] = useState<string | null>(null)
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)

  const mapRef = useRef<HTMLDivElement | null>(null)
  const pickupAutocompleteHostRef = useRef<HTMLDivElement | null>(null)
  const destinationAutocompleteHostRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)
  const autocompletePickupRef = useRef<any>(null)
  const autocompleteDestinationRef = useRef<any>(null)
  const googleGeocoderRef = useRef<any>(null)

  const estimateMutation = useMutation({
    mutationFn: (params: {
      pickupLat: number
      pickupLng: number
      dropoffLat: number
      dropoffLng: number
    }) => apiRequest<EstimateResponse>('/rides/estimate', { method: 'POST', body: params }),
  })

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setMapError('Google Maps key is missing. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in apps/web/.env.local.')
      return
    }

    let cancelled = false

    const toCoords = (location: any): LatLng | null => {
      if (!location) return null

      const lat = typeof location.lat === 'function' ? location.lat() : location.lat
      const lng = typeof location.lng === 'function' ? location.lng() : location.lng

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return null
      }

      return { lat, lng }
    }

    const createAutocomplete = async (
      host: HTMLDivElement,
      placeholder: string,
      onSelect: (value: string, coords: LatLng, viewport?: any) => void
    ) => {
      const { PlaceAutocompleteElement } = await window.google.maps.importLibrary('places') as any

      const element = new PlaceAutocompleteElement({})
      element.placeholder = placeholder
      element.className = 'w-full'

      element.addEventListener('gmp-select', async ({ placePrediction }: any) => {
        const place = placePrediction.toPlace()
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        })

        const coords = toCoords(place.location)
        if (!coords) return

        onSelect(
          place.formattedAddress || place.displayName || placeholder,
          coords,
          place.viewport
        )
      })

      host.innerHTML = ''
      host.appendChild(element)
      return element
    }

    const init = async () => {
      try {
        await loadGoogleMaps(apiKey)

        const { Map, Polyline } = await window.google.maps.importLibrary('maps') as any

        if (cancelled || !mapRef.current) return

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new Map(mapRef.current, {
            center: { lat: 9.0192, lng: 38.7525 },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          })
        }

        if (!routeLineRef.current) {
          routeLineRef.current = new Polyline({
            strokeColor: '#C2A878',
            strokeOpacity: 0.95,
            strokeWeight: 4,
            geodesic: true,
          })
          routeLineRef.current.setMap(mapInstanceRef.current)
        }

        if (!googleGeocoderRef.current) {
          googleGeocoderRef.current = new window.google.maps.Geocoder()
        }

        if (pickupAutocompleteHostRef.current && !autocompletePickupRef.current) {
          autocompletePickupRef.current = await createAutocomplete(
            pickupAutocompleteHostRef.current,
            'Pickup location',
            (value, coords, viewport) => {
              setPickup(value)
              setPickupCoords(coords)

              if (viewport && mapInstanceRef.current) {
                mapInstanceRef.current.fitBounds(viewport)
              } else if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(coords)
                mapInstanceRef.current.setZoom(15)
              }
            }
          )
        }

        if (destinationAutocompleteHostRef.current && !autocompleteDestinationRef.current) {
          autocompleteDestinationRef.current = await createAutocomplete(
            destinationAutocompleteHostRef.current,
            'Destination',
            (value, coords, viewport) => {
              setDestination(value)
              setDestinationCoords(coords)

              if (viewport && mapInstanceRef.current) {
                mapInstanceRef.current.fitBounds(viewport)
              } else if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(coords)
                mapInstanceRef.current.setZoom(15)
              }
            }
          )
        }

        if (!cancelled) {
          setMapsReady(true)
        }
      } catch {
        if (!cancelled) {
          setMapError('Google Maps could not be loaded. Check that Maps JavaScript API, Places API (New), and Geocoding API are enabled for this key.')
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mapsReady || !mapInstanceRef.current || !window.google?.maps) return

    const map = mapInstanceRef.current

    if (routeLineRef.current) {
      routeLineRef.current.setPath([])
    }

    if (pickupCoords && destinationCoords) {
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(pickupCoords)
      bounds.extend(destinationCoords)
      map.fitBounds(bounds)

      routeLineRef.current?.setPath([pickupCoords, destinationCoords])
      return
    }

    const singlePoint = pickupCoords ?? destinationCoords
    if (singlePoint) {
      map.setCenter(singlePoint)
      map.setZoom(15)
    }
  }, [mapsReady, pickupCoords, destinationCoords])

  const geocodeAddress = async (address: string): Promise<LatLng> => {
    if (!window.google?.maps || !googleGeocoderRef.current) {
      throw new Error('Google Maps is not ready')
    }

    return new Promise<LatLng>((resolve, reject) => {
      googleGeocoderRef.current.geocode({ address }, (results: any[], status: string) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          })
          return
        }

        reject(new Error(`Could not geocode "${address}"`))
      })
    })
  }

  const handleSearch = async () => {
    try {
      setMapError(null)

      const pickupLocation = pickupCoords ?? (pickup.trim() ? await geocodeAddress(pickup.trim()) : null)
      const destinationLocation = destinationCoords ?? (destination.trim() ? await geocodeAddress(destination.trim()) : null)

      if (!pickupLocation || !destinationLocation) {
        setMapError('Select both pickup and destination from the Places suggestions before comparing rides.')
        return
      }

      setPickupCoords(pickupLocation)
      setDestinationCoords(destinationLocation)

      estimateMutation.mutate({
        pickupLat: pickupLocation.lat,
        pickupLng: pickupLocation.lng,
        dropoffLat: destinationLocation.lat,
        dropoffLng: destinationLocation.lng,
      })
    } catch (error) {
      setMapError(error instanceof Error ? error.message : 'Unable to route these locations.')
    }
  }

  const estimates = estimateMutation.data?.estimates ?? []

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <section className="card-elevated animate-fade-in-up p-6 sm:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold">Ride planner</p>
          <h1 className="font-serif text-3xl font-bold text-app-fg sm:text-4xl">Where are you headed?</h1>
          <div className="mt-8 space-y-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-3.5 transition-shadow focus-within:shadow-card">
              <div className="mb-2 flex items-center gap-3 text-sm text-app-muted">
                <Navigation className="size-4 shrink-0 text-gold" />
                <span>Pickup location</span>
              </div>
              <div ref={pickupAutocompleteHostRef} />
              {pickup && <p className="mt-2 text-xs text-app-muted">Selected: {pickup}</p>}
            </div>
            <div className="flex justify-center">
              <span className="flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-app-muted">
                <ArrowDownUp className="size-4" />
              </span>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-3.5 transition-shadow focus-within:shadow-card">
              <div className="mb-2 flex items-center gap-3 text-sm text-app-muted">
                <MapPin className="size-4 shrink-0 text-gold" />
                <span>Destination</span>
              </div>
              <div ref={destinationAutocompleteHostRef} />
              {destination && <p className="mt-2 text-xs text-app-muted">Selected: {destination}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={estimateMutation.isPending || !mapsReady}
            className="btn-primary mt-6 w-full !py-3 text-sm disabled:opacity-50"
          >
            {estimateMutation.isPending ? 'Searching rides...' : mapsReady ? 'Compare rides' : 'Loading maps...'}
          </button>
          {mapError && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mapError}
            </p>
          )}
          <div className="mt-6 rounded-xl bg-navy p-5 text-white shadow-card">
            <div className="flex items-center gap-2 text-gold">
              <CarFront className="size-5" />
              <span className="text-xs font-bold uppercase tracking-[0.14em]">Compare in one place</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ivory/75">See available ride choices and pick the option that works for you.</p>
          </div>
        </section>

        <section className="card-elevated animate-fade-in-up p-6 sm:p-8" style={{ animationDelay: '90ms' }}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-app-fg">Available rides</h2>
            {estimates.length > 0 && <span className="badge-gold">Live</span>}
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-input)]">
            <div ref={mapRef} className="h-[320px] w-full" />
          </div>

          {estimateMutation.isPending && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-xl bg-[var(--bg-input)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded bg-[var(--bg-input)]" />
                      <div className="h-3 w-32 rounded bg-[var(--bg-input)]" />
                    </div>
                    <div className="h-5 w-16 rounded bg-[var(--bg-input)]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!estimateMutation.isPending && estimates.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center text-app-muted">
              <CarFront className="mb-4 size-10" />
              <p className="text-lg">Enter pickup and destination</p>
              <p className="mt-1 text-sm">Then tap &ldquo;Compare rides&rdquo; to see options.</p>
            </div>
          )}

          {estimates.length > 0 && (
            <div className="space-y-3">
              {estimates.map((ride, i) => (
                <button
                  key={`${ride.providerName}-${ride.tier}-${i}`}
                  type="button"
                  onClick={() => setSelectedRide(ride.providerName)}
                  className={`animate-fade-in-up flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
                    selectedRide === ride.providerName
                      ? 'border-gold/50 bg-gold/5 shadow-soft'
                      : 'border-[var(--border)] hover:border-gold/30 hover:bg-[var(--bg-hover)]'
                  }`}
                  style={{ animationDelay: `${120 + i * 70}ms` }}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-input)] text-app-fg">
                    <CarFront className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-app-fg">
                      {ride.providerName} {ride.tier !== 'Economy' && <span className="text-xs text-app-muted">({ride.tier})</span>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-sm text-app-muted">
                      <Clock3 className="size-3.5" />
                      {ride.etaMinutes} min away
                      {ride.badge && <span className="ml-1 text-gold">· {ride.badge}</span>}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 font-bold text-app-fg">
                    {ride.estimatedPrice.currency === 'ETB' ? 'ETB' : '$'}{ride.estimatedPrice.amount.toFixed(2)}
                    {selectedRide === ride.providerName && <Check className="animate-pop-in size-4 text-gold" />}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedRide && (
            <p className="animate-pop-in mt-5 flex items-center gap-2 rounded-xl bg-gold/10 px-4 py-3 text-sm font-medium text-app-fg">
              <CheckCircle2 className="size-4 shrink-0 text-gold" />
              {selectedRide} selected for {destination || 'your destination'}.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
