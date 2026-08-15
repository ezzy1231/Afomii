'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CarFront, CheckCircle2, Clock3, LocateFixed, MapPin, Navigation } from 'lucide-react'
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
  const [manualDistanceKm, setManualDistanceKm] = useState('')
  const [localEstimates, setLocalEstimates] = useState<RideEstimate[] | null>(null)
  const [selectedRide, setSelectedRide] = useState<string | null>(null)
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapsReady, setMapsReady] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

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
          setMapError('Using manual meter-taxi pricing because Google Maps is unavailable.')
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

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <div className="rounded-[30px] border border-[#d7b778]/30 bg-[#071a2e] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#d7b778]">Ride</div>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#f8f2ea] sm:text-5xl">Go &amp; Book Ride</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7b778]/35 bg-[#d7b778]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f0d79a]">
            <CheckCircle2 className="size-3.5" />
            Secure
          </div>
        </div>

        <div className="mb-6 rounded-[24px] border border-[#d7b778]/25 bg-[#0c1f34] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(215,183,120,0.35),transparent_30%),linear-gradient(135deg,#392210,#1a1f2a,#091c2f)] text-2xl">
              🏪
            </div>
            <div className="flex-1">
              <div className="font-serif text-2xl font-bold text-[#f8f1e7]">Bella Italia Restaurant</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-[#d7d0c5]">
                <span>Italian</span>
                <span className="text-[#d7b778]">•</span>
                <span>4.6</span>
              </div>
              <div className="mt-1 text-sm text-[#d7d0c5]">Table for 2 · Today at 7:00 PM</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[26px] border border-[#d7b778]/20 bg-[#0b1d30] p-4 sm:p-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#d7b778]/15 bg-[#0d1f33] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-[#d7b778]">
                  <Navigation className="size-4" />
                  Pickup
                </div>
                <div className="flex gap-2">
                  <input
                    value={pickup}
                    onChange={(event) => {
                      setPickup(event.target.value)
                      setPickupCoords(null)
                    }}
                    placeholder="Enter pickup location"
                    className="min-w-0 flex-1 rounded-xl border border-[#d7b778]/15 bg-[#102238] px-3 py-2 text-sm text-[#f7f0e7] outline-none placeholder:text-[#a99e8e] focus:border-[#d7b778]/50"
                    aria-label="Pickup location"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={isLocating}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d7b778]/30 px-3 text-sm font-medium text-[#f0d79a] disabled:opacity-60"
                  >
                    <LocateFixed className="size-4" />
                    {isLocating ? 'Locating' : 'Use location'}
                  </button>
                </div>
                <div ref={pickupAutocompleteHostRef} className="mt-2" />
              </div>

              <div className="rounded-2xl border border-[#d7b778]/15 bg-[#0d1f33] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-[#d7b778]">
                  <MapPin className="size-4" />
                  Destination
                </div>
                <input
                  value={destination}
                  onChange={(event) => {
                    setDestination(event.target.value)
                    setDestinationCoords(null)
                  }}
                  placeholder="Enter your destination"
                  className="w-full rounded-xl border border-[#d7b778]/15 bg-[#102238] px-3 py-2 text-sm text-[#f7f0e7] outline-none placeholder:text-[#a99e8e] focus:border-[#d7b778]/50"
                  aria-label="Destination"
                />
                <div ref={destinationAutocompleteHostRef} className="mt-2" />
                {destination && <div className="mt-3 text-sm text-[#d3cabf]">Selected: {destination}</div>}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#d7b778]/15 bg-[#0d1f33] p-4">
              <div className="mb-3 flex items-center gap-3 text-sm text-[#d7b778]">
                <CheckCircle2 className="size-4" />
                Why book your ride here?
              </div>
              <ul className="space-y-2 text-sm text-[#e5ddd2]">
                {['Compare prices in real time', 'Multiple trusted partners', 'Best prices, more choices', 'Safe & secure payments'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#d7b778]/15 text-[#d7b778]">✓</span>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[26px] border border-[#d7b778]/20 bg-[#0b1d30] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold text-[#f7f0e7]">Choose a ride</div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#d7b778]">Live prices</div>
            </div>

            <div className="space-y-3">
              {estimates.length > 0 ? estimates.map((ride, i) => (
                <button
                  key={`${ride.providerName}-${ride.tier}-${i}`}
                  type="button"
                  onClick={() => setSelectedRide(ride.providerName)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                    selectedRide === ride.providerName ? 'border-[#d7b778]/40 bg-[#d7b778]/10' : 'border-[#d7b778]/10 bg-[#101f32]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7b778]/10 text-sm font-bold text-[#f2d793]">{ride.providerName.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div className="font-semibold text-[#f7f0e7]">{ride.providerName}</div>
                      <div className="text-xs text-[#d3cabf]">{ride.tier} · {ride.etaMinutes} min</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#f7f0e7]">ETB {ride.estimatedPrice.amount}</div>
                    {ride.badge && <div className="text-[10px] uppercase tracking-[0.18em] text-[#d7b778]">{ride.badge}</div>}
                  </div>
                </button>
              )) : (
                <div className="space-y-3">
                  {[{providerName:'Uber', tier:'Economy', price:260, eta:3}, {providerName:'Yango', tier:'Economy', price:230, eta:3}, {providerName:'Lyft', tier:'Standard', price:240, eta:4}].map((ride) => (
                    <div key={ride.providerName} className="flex items-center justify-between rounded-2xl border border-[#d7b778]/10 bg-[#101f32] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7b778]/10 text-sm font-bold text-[#f2d793]">{ride.providerName.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="font-semibold text-[#f7f0e7]">{ride.providerName}</div>
                          <div className="text-xs text-[#d3cabf]">{ride.tier} · {ride.eta} min</div>
                        </div>
                      </div>
                      <div className="font-semibold text-[#f7f0e7]">ETB {ride.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-[20px] border border-[#d7b778]/20 bg-[#0d1d2f] p-3 text-sm text-[#e8dfd2]">
          <div className="flex items-center gap-2"><Clock3 className="size-4 text-[#d7b778]" />18 min total travel time</div>
          <div className="flex items-center gap-2"><MapPin className="size-4 text-[#d7b778]" />7.2 km</div>
          <div className="flex items-center gap-2"><CarFront className="size-4 text-[#d7b778]" />1-4 passengers</div>
        </div>

        <label className="mt-4 block rounded-2xl border border-[#d7b778]/15 bg-[#0d1d2f] p-3 text-sm text-[#e8dfd2]">
          <span className="mb-2 block text-[#d7b778]">Trip distance in kilometers</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={manualDistanceKm}
            onChange={(event) => setManualDistanceKm(event.target.value)}
            className="w-full rounded-xl border border-[#d7b778]/15 bg-[#102238] px-3 py-2 text-[#f7f0e7] outline-none placeholder:text-[#a99e8e] focus:border-[#d7b778]/50"
            placeholder="Example: 4.5"
            aria-label="Trip distance in kilometers"
          />
        </label>

        <button
          type="button"
          onClick={handleSearch}
          disabled={estimateMutation.isPending}
          className="mt-4 w-full rounded-2xl bg-[#d7b778] px-5 py-3 text-sm font-semibold text-[#07192b] disabled:opacity-60"
        >
          {estimateMutation.isPending ? 'Finding rides...' : 'Compare rides'}
        </button>
        {mapError && <p className="mt-3 rounded-xl border border-red-300/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">{mapError}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="rounded-2xl border border-[#d7b778]/35 bg-[#0d1d2f] px-5 py-4 text-left text-[#f7f0e7]">
            <div className="mb-2 text-xl">🧭</div>
            <div className="font-semibold">Go</div>
            <div className="text-sm text-[#d7d0c5]">Open navigation</div>
          </button>
          <button type="button" className="rounded-2xl bg-[#d7b778] px-5 py-4 text-left text-[#07192b]">
            <div className="mb-2 text-xl">🚕</div>
            <div className="font-semibold">Book Ride</div>
            <div className="text-sm text-[#07192b]/80">Request with Yango</div>
          </button>
        </div>
      </div>
    </main>
  )
}
