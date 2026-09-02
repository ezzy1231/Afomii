'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  BadgeCheck,
  CarFront,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  LocateFixed,
  Lock,
  MapPin,
  Navigation,
  Route,
  Search,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { EmptyState } from '@/components/patterns'
import { cn } from '@/lib/utils'
import {
  buildMeterTaxiEstimates,
  fetchRoute,
  type LatLng,
  type RideOption,
  type RouteInfo,
} from '@/lib/rides'

const RideMap = dynamic(() => import('@/components/RideMap'), { ssr: false })

type Suggestion = {
  label: string
  lat: number
  lng: number
  type: string
}

const ADDS_CENTER: LatLng = { lat: 9.0192, lng: 38.7525 }

export default function RidePlanner() {
  const [pickup, setPickup] = useState('')
  const [destination, setDestination] = useState('')
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<LatLng | null>(null)
  const [rideContext, setRideContext] = useState<string | null>(null)

  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [routing, setRouting] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)

  const [selectedRide, setSelectedRide] = useState<number | null>(null)
  const [dispatching, setDispatching] = useState(false)

  const [isLocating, setIsLocating] = useState(false)
  const [searchingPickup, setSearchingPickup] = useState(false)
  const [searchingDestination, setSearchingDestination] = useState(false)
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<Suggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<'pickup' | 'destination' | null>(null)

  // â”€â”€ Prefill from URL: ?to=<name> + optional &lat=&lng= â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const to = params.get('to')
    if (to) {
      setRideContext(to)
      setDestination(to)
      const lat = Number(params.get('lat'))
      const lng = Number(params.get('lng'))
      if (lat && lng) {
        setDestinationCoords({ lat, lng })
      }
    }
  }, [])

  // â”€â”€ Pickup: auto-detect location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setRouteError('Location services are not available in this browser. Enter a pickup location instead.')
      return
    }
    setIsLocating(true)
    setRouteError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setPickupCoords(coords)
        setPickup(`Current location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`)
        setIsLocating(false)
      },
      () => {
        setRouteError('We could not access your location. Check your browser permission or enter a pickup location.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }, [])

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

  // â”€â”€ Debounced address search (Nominatim via /api/geo/search) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (query: string, field: 'pickup' | 'destination') => {
    if (query.trim().length < 3) {
      if (field === 'pickup') setPickupSuggestions([])
      else setDestinationSuggestions([])
      return
    }
    if (field === 'pickup') setSearchingPickup(true)
    else setSearchingDestination(true)
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Search failed')
      const data = (await res.json()) as { results: Suggestion[] }
      const results = data.results ?? []
      if (field === 'pickup') setPickupSuggestions(results)
      else setDestinationSuggestions(results)
    } catch {
      if (field === 'pickup') setPickupSuggestions([])
      else setDestinationSuggestions([])
    } finally {
      if (field === 'pickup') setSearchingPickup(false)
      else setSearchingDestination(false)
    }
  }, [])

  const debouncedSearch = useCallback(
    (value: string, field: 'pickup' | 'destination') => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => void runSearch(value, field), 450)
    },
    [runSearch],
  )

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  const onPickupChange = (value: string) => {
    setPickup(value)
    setPickupCoords(null)
    setRoute(null)
    setSelectedRide(null)
    if (value.trim().length < 3) setPickupSuggestions([])
    else debouncedSearch(value, 'pickup')
    setActiveSuggestion('pickup')
  }

  const onDestinationChange = (value: string) => {
    setDestination(value)
    setDestinationCoords(null)
    setRoute(null)
    setSelectedRide(null)
    if (value.trim().length < 3) setDestinationSuggestions([])
    else debouncedSearch(value, 'destination')
    setActiveSuggestion('destination')
  }

  const pickSuggestion = (field: 'pickup' | 'destination', s: Suggestion) => {
    if (field === 'pickup') {
      setPickup(s.label)
      setPickupCoords({ lat: s.lat, lng: s.lng })
      setPickupSuggestions([])
    } else {
      setDestination(s.label)
      setDestinationCoords({ lat: s.lat, lng: s.lng })
      setDestinationSuggestions([])
    }
    setActiveSuggestion(null)
    setRoute(null)
    setSelectedRide(null)
  }

  const onMapClick = useCallback((lat: number, lng: number) => {
    // Tapping the map sets the destination so users can point exactly.
    setDestinationCoords({ lat, lng })
    setDestination(`Dropped pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`)
    setDestinationSuggestions([])
    setRoute(null)
    setSelectedRide(null)
  }, [])

  // â”€â”€ Auto-route when both coords are set â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!pickupCoords || !destinationCoords) return

    let cancelled = false
    setRouting(true)
    setRouteError(null)

    fetchRoute(pickupCoords, destinationCoords)
      .then((info) => {
        if (cancelled) return
        setRoute(info)
        setSelectedRide(null)
      })
      .catch(() => {
        if (cancelled) return
        setRouteError('Could not calculate the route right now. Check your connection and try again.')
      })
      .finally(() => {
        if (!cancelled) setRouting(false)
      })

    return () => {
      cancelled = true
    }
  }, [pickupCoords, destinationCoords])

  const estimates = useMemo<RideOption[]>(
    () => (route ? buildMeterTaxiEstimates(route.distanceKm) : []),
    [route],
  )
  const selected = selectedRide !== null ? estimates[selectedRide] : null
  const fastestEta = estimates.length ? Math.min(...estimates.map((e) => e.etaMinutes)) : null

  const routePath = useMemo<LatLng[] | null>(() => {
    if (route?.geometry) {
      return route.geometry.map(([lng, lat]) => ({ lat, lng }))
    }
    if (pickupCoords && destinationCoords) {
      return [pickupCoords, destinationCoords]
    }
    return null
  }, [route, pickupCoords, destinationCoords])

  const navigateHref =
    pickupCoords && destinationCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}`
      : destination.trim()
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.trim())}`
        : '#'

  async function handleDispatch() {
    if (!selected || dispatching) return
    setDispatching(true)
    try {
      const res = await fetch('/api/rides/dispatch-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: selected.providerName,
          pickupLat: pickupCoords?.lat ?? 0,
          pickupLng: pickupCoords?.lng ?? 0,
          dropoffLat: destinationCoords?.lat ?? 0,
          dropoffLng: destinationCoords?.lng ?? 0,
        }),
      })
      const result = (await res.json()) as { deepLink?: string; webFallback?: string }
      const target = result.deepLink || result.webFallback
      if (target) window.location.href = target
    } catch {
      setRouteError('Could not open the provider app. Try the Navigate button instead.')
    } finally {
      setDispatching(false)
    }
  }

  const renderSuggestions = (field: 'pickup' | 'destination', suggestions: Suggestion[], searching: boolean) => {
    if (activeSuggestion !== field) return null
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-app-border bg-app-card p-1.5 shadow-card">
        {searching ? (
          <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-app-muted">
            <Loader2 className="size-3.5 animate-spin text-ember" strokeWidth={2.5} />
            Searching places…
          </div>
        ) : suggestions.length === 0 ? (
          <p className="px-3 py-2.5 text-xs font-medium text-app-muted">No places found. Try a different address.</p>
        ) : (
          suggestions.map((s, i) => (
            <button
              key={`${field}-${s.lat}-${s.lng}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickSuggestion(field, s)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-app-input"
            >
              <MapPin className="size-3.5 shrink-0 text-ember" strokeWidth={2.5} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-app-fg">{s.label}</span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-app-muted">{s.type}</span>
              </span>
            </button>
          ))
        )}
      </div>
    )
  }

  const distanceDisplay = route ? `${route.distanceKm.toFixed(1)} km` : routing ? '…' : '—'
  const durationDisplay = route ? `${route.durationMin} min` : routing ? '…' : '—'

  return (
    <main className="mx-auto max-w-7xl px-4 pb-40 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-xl border border-app-border bg-app-card text-app-muted transition-all hover:-translate-y-0.5 hover:text-app-fg hover:shadow-glass active:translate-y-0 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">Go &amp; Book Ride</h1>
            <p className="text-xs font-medium text-app-muted">Compare and book from multiple ride partners</p>
          </div>
        </div>
        <span className="trust-pill">
          <BadgeCheck className="size-3.5" strokeWidth={2.5} />
          Secure
        </span>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Booking context */}
        {rideContext && (
          <Link
            href="/restaurants"
            className="glass glass-hover mb-5 flex items-center justify-between gap-3 rounded-2xl p-4"
          >
            <span className="flex min-w-0 items-center gap-3.5">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-app-border bg-app-input">
                <Image src="/places/food-3.jpg" alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xl font-bold text-app-fg">
                  Getting to {rideContext}
                </span>
                <span className="block text-xs font-medium text-app-muted">
                  Destination set · tap your trip card below to change
                </span>
              </span>
            </span>
            <span className="shrink-0 font-bold text-ember">›</span>
          </Link>
        )}

        {/* Route + why cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            {/* Pickup */}
            <div className="flex gap-3">
              <span className="mt-1.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border-[3px] border-ember" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-muted">
                  Pickup (your location)
                </p>
                <div className="relative">
                  <input
                    value={pickup}
                    onChange={(event) => onPickupChange(event.target.value)}
                    onFocus={() => setActiveSuggestion('pickup')}
                    onBlur={() => setTimeout(() => setActiveSuggestion(null), 150)}
                    placeholder="Enter pickup location"
                    className="mt-0.5 w-full bg-transparent text-sm font-semibold text-app-fg outline-none placeholder:font-normal placeholder:text-app-muted"
                    aria-label="Pickup location"
                  />
                  {pickup && (
                    <button
                      type="button"
                      onClick={() => {
                        setPickup('')
                        setPickupCoords(null)
                        setRoute(null)
                        setPickupSuggestions([])
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-fg"
                      aria-label="Clear pickup"
                    >
                      <X className="size-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                  {renderSuggestions('pickup', pickupSuggestions, searchingPickup)}
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isLocating}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-ember hover:underline disabled:opacity-60"
                >
                  <LocateFixed className="size-3" strokeWidth={2.5} />
                  {isLocating ? 'Detecting…' : 'Detected automatically — tap to refresh'}
                </button>
              </div>
            </div>

            <div className="ml-[6.5px] h-6 w-[1.5px] bg-app-border" aria-hidden />

            {/* Destination */}
            <div className="flex gap-3">
              <span className="mt-1.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border-[3px] border-danger" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-danger">Destination</p>
                <div className="relative">
                  <input
                    value={destination}
                    onChange={(event) => onDestinationChange(event.target.value)}
                    onFocus={() => setActiveSuggestion('destination')}
                    onBlur={() => setTimeout(() => setActiveSuggestion(null), 150)}
                    placeholder="Where to?"
                    className="mt-0.5 w-full bg-transparent text-sm font-bold text-app-fg outline-none placeholder:font-normal placeholder:text-app-muted"
                    aria-label="Destination"
                  />
                  {destination && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestination('')
                        setDestinationCoords(null)
                        setRoute(null)
                        setDestinationSuggestions([])
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-fg"
                      aria-label="Clear destination"
                    >
                      <X className="size-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                  {renderSuggestions('destination', destinationSuggestions, searchingDestination)}
                </div>
                <p className="mt-0.5 text-[10px] font-medium text-app-muted">
                  Tip: tap the map to drop a destination pin
                </p>
              </div>
            </div>
          </div>

          {/* Why book */}
          <div className="dot-grid glass rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-app-fg">
              <BadgeCheck className="size-5 text-ember" strokeWidth={2.5} />
              Why book your ride here?
            </h2>
            <ul className="mt-4 space-y-3">
              {[
                'Exact fares upfront — before you confirm',
                'No surge pricing: meter-rate rules only',
                'Compare providers side-by-side',
                'Hands you straight to your ride app',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 rounded-lg bg-white/40 px-2 py-1 text-sm font-medium text-app-muted dark:bg-white/5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ember text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Map + read-only trip info */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_240px]">
          <div
            className="glass relative h-64 overflow-hidden rounded-2xl sm:h-72"
          >
            <RideMap
              pickup={pickupCoords}
              destination={destinationCoords}
              routePath={routePath}
              onMapClick={onMapClick}
            />
            {routing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-app-fg">
                  <Loader2 className="size-3.5 animate-spin text-ember" strokeWidth={2.5} />
                  Calculating route…
                </span>
              </div>
            )}
          </div>

          <div className="glass flex flex-col gap-3 rounded-2xl p-4">
            <h2 className="text-lg font-bold text-app-fg">Trip summary</h2>
            <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-input/70 px-3.5 py-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-app-muted">
                <Route className="size-4 text-ember" strokeWidth={2.5} /> Distance
              </span>
              <span className="text-sm font-bold tabular-nums text-app-fg">{distanceDisplay}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-app-border bg-app-input/70 px-3.5 py-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-app-muted">
                <Clock3 className="size-4 text-ember" strokeWidth={2.5} /> Est. time
              </span>
              <span className="text-sm font-bold tabular-nums text-app-fg">{durationDisplay}</span>
            </div>
            {route?.source === 'haversine' && (
              <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] font-medium text-app-fg">
                Distance is a straight-line estimate and may differ from the actual road distance.
              </p>
            )}
            {routeError && (
              <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] font-medium text-danger">
                {routeError}
              </p>
            )}
          </div>
        </div>

        {/* Choose a ride */}
        <div className="glass mt-4 overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border bg-ink px-5 py-4">
            <h2 className="text-2xl font-bold text-white">Choose a ride</h2>
            <span className="trust-pill">
              <CheckCircle2 className="size-3" strokeWidth={2.5} />
              Fare upfront · ETB · No surge
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
                      'mb-1 flex w-full items-center gap-4 rounded-xl border px-3 py-3.5 text-left transition-all duration-200',
                      active
                        ? 'border-ember/40 bg-ember/10 shadow-soft'
                        : 'border-transparent hover:bg-app-input/70',
                    )}
                  >
                    <span className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold uppercase',
                      active ? 'bg-ember text-white' : 'bg-app-elevated text-app-muted',
                    )}>
                      {ride.providerName.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-app-fg">{ride.providerName}</span>
                      <span className="block text-xs font-medium text-app-muted">{ride.tier}</span>
                    </span>
                    <span className="shrink-0 text-center">
                      <span className="block text-sm font-bold text-app-fg">{ride.etaMinutes} min</span>
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-app-muted">ETA</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-extrabold tabular-nums text-app-fg">
                        {ride.estimatedPrice.currency} {ride.estimatedPrice.amount.toLocaleString()}
                      </span>
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-app-muted">
                        Upfront
                      </span>
                    </span>
                    {ride.badge && (
                      <span className="sticker sticker-amber hidden !rotate-0 !px-2 !py-0.5 !text-[10px] sm:inline-flex">
                        {ride.badge}
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                        active ? 'border-ember' : 'border-app-border',
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-ember" />}
                    </span>
                  </button>
                )
              })
            ) : (
              <EmptyState
                icon={<CarFront className="size-6" />}
                title="No estimates yet"
                message="Set a pickup and destination to see live meter-taxi fares."
              />
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="nav-blur fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 border-t border-app-border safe-bottom md:bottom-0">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-3 sm:justify-between">
          <div className="hidden items-center gap-6 sm:flex">
            {[
              { icon: Clock3, value: fastestEta ? `${fastestEta} min` : '—', label: 'Total time' },
              { icon: Route, value: distanceDisplay, label: 'Distance' },
              { icon: Users, value: '1-4', label: 'Passengers' },
              { icon: Lock, value: 'In app', label: 'Secure pay' },
            ].map(({ icon: Icon, value, label }) => (
              <span key={label} className="flex flex-col items-center">
                <Icon className="size-4 text-ember" strokeWidth={2.5} />
                <span className="mt-0.5 text-sm font-bold text-app-fg">{value}</span>
                <span className="text-[10px] font-medium text-app-muted">{label}</span>
              </span>
            ))}
          </div>

          <div className="flex w-full gap-3 sm:w-auto">
            <a
              href={navigateHref}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-subtle flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98] sm:flex-none"
            >
              <Navigation className="size-4 text-ember" strokeWidth={2.5} />
              <span className="flex flex-col items-start leading-none">
                <span>Go</span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-app-muted">
                  Open navigation
                </span>
              </span>
            </a>
            <button
              type="button"
              onClick={handleDispatch}
              disabled={!selected || dispatching}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-ember to-ember-deep px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(var(--ember-rgb)/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgb(var(--ember-rgb)/0.45)] active:translate-y-0 active:scale-[0.98] disabled:opacity-40 sm:flex-none"
            >
              <CarFront className="size-4" strokeWidth={2.5} />
              <span className="flex flex-col items-start leading-none">
                <span>
                  {dispatching
                    ? 'Opening…'
                    : selected
                      ? `Book · ${selected.providerName}`
                      : 'Book Ride'}
                </span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-white/70">
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
