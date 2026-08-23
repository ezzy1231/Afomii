'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowLeft,
  BadgeCheck,
  CarFront,
  Check,
  CheckCircle2,
  Clock3,
  Lock,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiRequest } from '@/lib/api'
import { EmptyState } from '@/components/patterns'
import { cn } from '@/lib/utils'

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

function roundBirr(amount: number) {
  return Math.round(amount)
}

function buildMeterTaxiEstimates(distanceKm: number): RideEstimate[] {
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

declare global {
  interface Window {
    google?: any
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
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
  const [manualDistanceKm, setManualDistanceKm] = useState('')
  const [localEstimates, setLocalEstimates] = useState<RideEstimate[] | null>(null)
  const [selectedRide, setSelectedRide] = useState<number | null>(null)
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [rideContext, setRideContext] = useState<string | null>(null)

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
    const params = new URLSearchParams(window.location.search)
    const to = params.get('to')
    if (to) {
      setRideContext(to)
      setDestination(to)
    }
  }, [])

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Location services are not available in this browser. Enter a pickup location instead.')
      return
    }

    setIsLocating(true)
    setMapError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setPickupCoords(coords)
        setPickup(`Current location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`)
        setIsLocating(false)
      },
      () => {
        setMapError('We could not access your location. Check your browser permission or enter a pickup location.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setPickupCoords(coords)
        setPickup(`Current location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`)
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setMapError('Maps enhancement is unavailable — manual distance pricing below works fully without it.')
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
          setMapError('Maps enhancement is unavailable — manual distance pricing below works fully without it.')
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
      setSelectedRide(null)

      const pickupLocation = pickupCoords ?? (pickup.trim() ? await geocodeAddress(pickup.trim()) : null)
      const destinationLocation = destinationCoords ?? (destination.trim() ? await geocodeAddress(destination.trim()) : null)

      if (!pickupLocation || !destinationLocation) {
        const parsedDistance = Number(manualDistanceKm)

        if (!Number.isFinite(parsedDistance) || parsedDistance <= 0) {
          setMapError('Enter a trip distance in kilometers, or select pickup and destination from the map suggestions.')
          return
        }

        setLocalEstimates(buildMeterTaxiEstimates(parsedDistance))

        if (!mapsReady) {
          setMapError('Showing meter-taxi estimates from your distance. Maps pricing returns when Maps is available.')
        }

        return
      }

      setLocalEstimates(null)
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

  const estimates = localEstimates ?? estimateMutation.data?.estimates ?? []
  const selected = selectedRide !== null ? estimates[selectedRide] : null
  const fastestEta = estimates.length ? Math.min(...estimates.map((e) => e.etaMinutes)) : null
  const distanceKm = Number(manualDistanceKm)

  return (
    <main className="mx-auto max-w-7xl px-4 pb-40 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-input hover:text-app-fg"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">Go &amp; Book Ride</h1>
            <p className="text-xs text-app-muted">Compare and book from multiple ride partners</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ivory">
          <BadgeCheck className="size-3.5" />
          Secure
        </span>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Booking context */}
        {rideContext && (
          <Link
            href="/restaurants"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-card p-4 shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]"
          >
            <span className="flex min-w-0 items-center gap-3.5">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-app-input">
                <Image src="/places/food-3.jpg" alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-serif text-xl font-bold text-app-fg">
                  {rideContext}
                </span>
                <span className="block text-xs text-app-muted">
                  Your destination, set automatically
                </span>
              </span>
            </span>
            <span className="shrink-0 text-app-muted">›</span>
          </Link>
        )}

        {/* Route + why cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-app-border bg-app-card p-4 shadow-[var(--shadow-sm)]">
            {/* Pickup */}
            <div className="flex gap-3">
              <span className="mt-1.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border-[3px] border-navy dark:border-gold" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-muted">
                  Pickup (your location)
                </p>
                <input
                  value={pickup}
                  onChange={(event) => {
                    setPickup(event.target.value)
                    setPickupCoords(null)
                  }}
                  placeholder="Enter pickup location"
                  className="mt-0.5 w-full bg-transparent text-sm font-semibold text-app-fg outline-none placeholder:font-normal placeholder:text-app-muted"
                  aria-label="Pickup location"
                />
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isLocating}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-gold-soft hover:underline disabled:opacity-60"
                >
                  <LocateFixed className="size-3" />
                  {isLocating ? 'Detecting…' : 'Detected automatically — tap to refresh'}
                </button>
                <div ref={pickupAutocompleteHostRef} className="mt-2" />
              </div>
            </div>

            <div className="ml-[6.5px] h-6 w-px bg-app-border" aria-hidden />

            {/* Destination */}
            <div className="flex gap-3">
              <span className="mt-1.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border-[3px] border-danger" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-danger">
                  Destination
                </p>
                <input
                  value={destination}
                  onChange={(event) => {
                    setDestination(event.target.value)
                    setDestinationCoords(null)
                  }}
                  placeholder="Where to?"
                  className="mt-0.5 w-full bg-transparent text-sm font-semibold text-app-fg outline-none placeholder:font-normal placeholder:text-app-muted"
                  aria-label="Destination"
                />
                <div ref={destinationAutocompleteHostRef} className="mt-2" />
              </div>
            </div>

            {/* Manual distance */}
            <div className="mt-4 rounded-lg border border-dashed border-gold/40 bg-app-input p-3">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gold-soft">
                Trip distance (km) — works without maps
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={manualDistanceKm}
                  onChange={(event) => setManualDistanceKm(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-app-border bg-app-card px-3 py-2 text-sm tabular-nums text-app-fg outline-none placeholder:text-app-muted focus:border-gold"
                  placeholder="Example: 4.5"
                  aria-label="Trip distance in kilometers"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={estimateMutation.isPending}
                  className="shrink-0 rounded-md bg-navy px-5 text-sm font-semibold text-ivory transition-transform active:scale-[0.98] disabled:opacity-60 dark:bg-gold dark:text-navy"
                >
                  {estimateMutation.isPending ? 'Finding…' : 'Compare'}
                </button>
              </div>
            </div>
          </div>

          {/* Why book */}
          <div className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="flex items-center gap-2 font-serif text-xl font-bold">
              <BadgeCheck className="size-5 text-gold-soft" />
              Why book your ride here?
            </h2>
            <ul className="mt-4 space-y-3">
              {[
                'Compare prices in real time',
                'Multiple trusted partners',
                'Best prices, more choices',
                'Safe & secure payments',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-app-muted">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold-soft">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Map */}
        <div className="mt-4">
          <div
            ref={mapRef}
            className="h-52 overflow-hidden rounded-xl border border-app-border bg-app-input sm:h-64"
          />
          {!mapsReady && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-app-muted">
              <CheckCircle2 className="size-3.5 text-success" />
              Map is optional — fare estimates work with distance only.
            </p>
          )}
          {mapError && (
            <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-app-fg">
              {mapError}
            </p>
          )}
        </div>

        {/* Choose a ride */}
        <div className="mt-4 rounded-xl border border-app-border bg-app-card shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
            <h2 className="font-serif text-2xl font-bold">Choose a ride</h2>
            <span className="flex items-center gap-1.5 text-xs text-app-muted">
              <Clock3 className="size-3.5" />
              Prices update in real time
            </span>
          </div>

          <div className="p-3">
            {estimates.length > 0 ? (
              estimates.map((ride, i) => {
                const active = selectedRide === i
                return (
                  <button
                    key={`${ride.providerName}-${ride.tier}-${i}`}
                    type="button"
                    onClick={() => setSelectedRide(i)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg px-3 py-3.5 text-left transition-colors',
                      active ? 'bg-gold/10' : 'hover:bg-app-input'
                    )}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-navy text-xs font-bold uppercase text-gold">
                      {ride.providerName.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-app-fg">{ride.providerName}</span>
                      <span className="block text-xs text-app-muted">{ride.tier}</span>
                    </span>
                    <span className="shrink-0 text-center">
                      <span className="block text-sm font-semibold text-app-fg">{ride.etaMinutes} min</span>
                      <span className="block text-[10px] uppercase tracking-wider text-app-muted">ETA</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold tabular-nums text-app-fg">
                        {ride.estimatedPrice.currency} {ride.estimatedPrice.amount.toLocaleString()}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-app-muted">
                        Estimate
                      </span>
                    </span>
                    {ride.badge && (
                      <span className="hidden shrink-0 rounded bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-soft sm:block">
                        {ride.badge}
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        active ? 'border-gold' : 'border-app-border'
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-gold" />}
                    </span>
                  </button>
                )
              })
            ) : (
              <EmptyState
                icon={<CarFront className="size-6" />}
                title="No estimates yet"
                message="Set pickup and destination, or enter your trip distance to see live meter-taxi fares."
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-app-border bg-app-card/95 backdrop-blur-lg safe-bottom">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-3 sm:justify-between">
          <div className="hidden items-center gap-6 sm:flex">
            {[
              { icon: Clock3, value: fastestEta ? `${fastestEta} min` : '—', label: 'Total time' },
              { icon: Route, value: distanceKm > 0 ? `${distanceKm} km` : '—', label: 'Distance' },
              { icon: Users, value: '1-4', label: 'Passengers' },
              { icon: Lock, value: 'In app', label: 'Secure pay' },
            ].map(({ icon: Icon, value, label }) => (
              <span key={label} className="flex flex-col items-center">
                <Icon className="size-4 text-app-muted" />
                <span className="mt-0.5 text-sm font-semibold text-app-fg">{value}</span>
                <span className="text-[10px] text-app-muted">{label}</span>
              </span>
            ))}
          </div>

          <div className="flex w-full gap-3 sm:w-auto">
            <Link
              href="#"
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy transition-transform active:scale-[0.98] dark:border-gold dark:text-gold sm:flex-none"
            >
              <Navigation className="size-4" />
              <span className="flex flex-col items-start leading-none">
                <span>Go</span>
                <span className="mt-0.5 text-[9px] font-normal uppercase tracking-wider opacity-60">
                  Open navigation
                </span>
              </span>
            </Link>
            <button
              type="button"
              disabled={!selected}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-bold text-navy transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-40 sm:flex-none"
            >
              <CarFront className="size-4" />
              <span className="flex flex-col items-start leading-none">
                <span>{selected ? `Book · ${selected.providerName}` : 'Book Ride'}</span>
                <span className="mt-0.5 text-[9px] font-normal uppercase tracking-wider opacity-60">
                  {selected ? `${selected.estimatedPrice.currency} ${selected.estimatedPrice.amount}` : 'Select a ride'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
