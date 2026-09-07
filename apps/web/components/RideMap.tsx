'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLng } from '@/lib/rides'

type Props = {
  pickup: LatLng | null
  destination: LatLng | null
  /** Route polyline as [lat, lng] pairs (converted from OSRM [lng, lat]). */
  routePath: LatLng[] | null
  onMapClick?: (lat: number, lng: number) => void
}

/**
 * Leaflet + OSM tile map with ember markers and a routed polyline.
 * Loaded client-only (see RidePlanner's next/dynamic) so Leaflet never touches
 * the server. Uses divIcons instead of the default marker sprite to avoid
 * bundler path issues.
 */
export default function RideMap({ pickup, destination, routePath, onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pickupMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [9.0192, 38.7525],
      zoom: 12,
      scrollWheelZoom: false,
      attributionControl: true,
    })
    mapRef.current = map

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const onClick = (e: L.LeafletMouseEvent) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', onClick)

    return () => {
      map.off('click', onClick)
      map.remove()
      mapRef.current = null
      pickupMarkerRef.current = null
      destinationMarkerRef.current = null
      routeLineRef.current = null
    }
  }, [onMapClick])

  const emberIcon = (label: string) =>
    L.divIcon({
      className: '',
      html: `<div class="flex h-8 min-w-8 items-center justify-center rounded-full bg-ember px-2 text-[11px] font-bold text-[#080C17] shadow-[0_2px_8px_rgba(0,0,0,0.3)] ring-2 ring-white">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

  const inkIcon = (label: string) =>
    L.divIcon({
      className: '',
      html: `<div class="flex h-8 min-w-8 items-center justify-center rounded-full bg-ink px-2 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] ring-2 ring-white">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Pickup marker
    if (pickup) {
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], { icon: emberIcon('A') }).addTo(map)
      } else {
        pickupMarkerRef.current.setLatLng([pickup.lat, pickup.lng])
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove()
      pickupMarkerRef.current = null
    }

    // Destination marker
    if (destination) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: inkIcon('B') }).addTo(map)
      } else {
        destinationMarkerRef.current.setLatLng([destination.lat, destination.lng])
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove()
      destinationMarkerRef.current = null
    }

    // Route polyline
    if (routeLineRef.current) {
      routeLineRef.current.remove()
      routeLineRef.current = null
    }
    if (routePath && routePath.length > 1) {
      routeLineRef.current = L.polyline(routePath, {
        color: '#E05028',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
      }).addTo(map)
    }

    // Fit bounds
    if (pickup && destination) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ])
      map.fitBounds(bounds, { padding: [36, 36] })
    } else {
      const single = pickup ?? destination
      if (single) {
        map.setView([single.lat, single.lng], 15)
      }
    }
  }, [pickup, destination, routePath])

  return <div ref={containerRef} className="h-full w-full" aria-label="Route map" />
}
