'use client'

import { useState } from 'react'
import { ArrowLeft, Clock3, MapPin, Phone, Star, Utensils } from 'lucide-react'
import Link from 'next/link'

type Branch = {
  id: string
  branchName: string
  address: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  bookingConfig: {
    bookingMode: string
    totalTables: number
    maxGuestPerTable: number
  } | null
  menuItems: {
    id: string
    name: string
    price: number
    category: string
    isAvailable: boolean
  }[]
}

type Restaurant = {
  id: string
  name: string
  category: string
  logoUrl: string | null
  coverUrl: string | null
  isVerified: boolean
  openingHours: Record<string, { open: string; close: string }[]> | null
  branches: Branch[]
}

export default function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  const [selectedBranch, setSelectedBranch] = useState(restaurant.branches[0]?.id ?? null)
  const branch = restaurant.branches.find((b) => b.id === selectedBranch) ?? restaurant.branches[0]

  const menuCategories = branch?.menuItems
    ? [...new Set(branch.menuItems.map((item) => item.category))]
    : []

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <Link href="/restaurants" className="mb-6 inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-fg transition-colors">
        <ArrowLeft className="size-4" />
        Back to restaurants
      </Link>

      <div className="card-elevated overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-navy to-navy/80 p-6 sm:h-64">
          <div className="flex items-center gap-2">
            <span className="badge-gold">{restaurant.category}</span>
            {restaurant.isVerified && (
              <span className="badge-gold bg-green-500/10 text-green-600">Verified</span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">{restaurant.name}</h1>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-4 text-sm text-app-muted">
            {branch?.address && (
              <span className="flex items-center gap-1.5"><MapPin className="size-4" />{branch.address}</span>
            )}
            {branch?.phone && (
              <span className="flex items-center gap-1.5"><Phone className="size-4" />{branch.phone}</span>
            )}
            {branch?.bookingConfig && (
              <span className="flex items-center gap-1.5"><Clock3 className="size-4" />{branch.bookingConfig.bookingMode.replace(/_/g, ' ')}</span>
            )}
          </div>

          {restaurant.branches.length > 1 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-app-fg">Branches</h3>
              <div className="flex gap-2">
                {restaurant.branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.id)}
                    className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                      selectedBranch === b.id
                        ? 'border-gold/50 bg-gold/10 text-app-fg font-medium'
                        : 'border-[var(--border)] text-app-muted hover:border-gold/30'
                    }`}
                  >
                    {b.branchName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {restaurant.openingHours && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-app-fg">Opening Hours</h3>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {Object.entries(restaurant.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between rounded-lg bg-[var(--bg-input)] px-3 py-2">
                    <span className="capitalize text-app-muted">{day}</span>
                    <span className="font-medium text-app-fg">
                      {hours.map((h) => `${h.open}–${h.close}`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {branch?.menuItems && branch.menuItems.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-app-fg">
                <Utensils className="size-4" />Menu
              </h3>
              {menuCategories.map((category) => (
                <div key={category} className="mb-6">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">{category}</h4>
                  <div className="space-y-2">
                    {branch.menuItems
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-app-fg">{item.name}</p>
                            {!item.isAvailable && (
                              <p className="text-xs text-red-500">Currently unavailable</p>
                            )}
                          </div>
                          <span className="font-semibold text-app-fg">ETB {item.price}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Link href="/ride" className="btn-secondary flex-1 text-center !py-3">
              Go by Ride
            </Link>
            <button type="button" className="btn-primary flex-1 !py-3">
              Book a Table
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
