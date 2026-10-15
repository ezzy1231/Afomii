'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CarFront,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
  Utensils,
  ChevronRight,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ReservationForm } from '@/components/reservation-form'
import { StickyActionBar } from '@/components/patterns'
import type { RestaurantDetail as Restaurant } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'
import { sharePage } from '@/lib/share'
import { loadSavedIds, persistSavedIds } from '@/lib/saved'

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_SHORT: Record<(typeof WEEK_DAYS)[number], string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

export default function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  const [selectedBranch, setSelectedBranch] = useState(restaurant.branches[0]?.id ?? null)
  const [saved, setSaved] = useState(() => loadSavedIds().includes(restaurant.id))
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const toggleSaved = () => {
    setSaved((v) => {
      const next = !v
      const ids = loadSavedIds()
      persistSavedIds(next ? [...ids, restaurant.id] : ids.filter((id) => id !== restaurant.id))
      return next
    })
  }
  const branch = restaurant.branches.find((b) => b.id === selectedBranch) ?? restaurant.branches[0]
  const initial = restaurant.name.charAt(0).toUpperCase()
  // JS getDay(): 0=Sunday … 6=Saturday → our keys are 'mon'-first
  const todayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[new Date().getDay()]
  const rideHref = `/ride?to=${encodeURIComponent(restaurant.name)}${branch?.latitude != null && branch?.longitude != null ? `&lat=${branch.latitude}&lng=${branch.longitude}` : ''}`
  const todayRange = restaurant.openingHours?.[todayKey as (typeof WEEK_DAYS)[number]]?.[0]
  const hasHours = Boolean(restaurant.openingHours && Object.keys(restaurant.openingHours).length > 0)
  const ratingIsScore = restaurant.rating != null && !Number.isNaN(Number(restaurant.rating))
  const share = () => {
    sharePage(restaurant.name, `/restaurants/${restaurant.id}`).then((r) => {
      if (r === 'copied') {
        setShareStatus('copied')
        window.setTimeout(() => setShareStatus('idle'), 2000)
      }
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-5 sm:px-6 sm:pb-20 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-app-muted">
        <Link href="/restaurants" className="inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:text-app-fg hover:underline">
          <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden />
          Restaurants
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate text-app-fg" aria-current="page">{restaurant.name}</span>
      </nav>

      {/* Identity */}
      <header className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-app-border bg-app-card">
            {restaurant.logoUrl ? (
              <Image src={restaurant.logoUrl} alt="" width={64} height={64} className="size-full object-cover" />
            ) : (
              <span aria-hidden className="font-display text-2xl font-bold text-ember">{initial}</span>
            )}
          </span>
          <div className="min-w-0">
            {restaurant.category && <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gold-text">{restaurant.category}</p>}
            <h1 className="mt-1 text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-app-fg sm:text-5xl">{restaurant.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-app-muted">
              <span className="inline-flex items-center gap-1">
                {ratingIsScore && <Star className="size-4 fill-signal text-signal" aria-hidden />}
                <span className="font-semibold text-app-fg">{ratingIsScore ? `Rated ${restaurant.rating}` : 'New on UrbanExplore'}</span>
              </span>
              {restaurant.isVerified && (
                <span className="trust-pill"><BadgeCheck className="size-3.5" aria-hidden />Verified partner</span>
              )}
              {restaurant.branches.length > 1 && <span>{restaurant.branches.length} locations</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/restaurants/${restaurant.id}/menu`} className="btn-primary">
            <Utensils className="size-4" aria-hidden />View Menu
          </Link>
          <Link href={rideHref} className="btn-secondary">
            <Navigation className="size-4" aria-hidden />Directions
          </Link>
          <button type="button" aria-label="Share" onClick={share} className="btn-secondary !px-3">
            {shareStatus === 'copied' ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
            <span aria-live="polite" className="text-sm">{shareStatus === 'copied' ? 'Link copied' : ''}</span>
          </button>
          <button type="button" aria-label="Save" aria-pressed={saved} onClick={toggleSaved} className={cn('btn-secondary !px-3', saved && '!border-ember !bg-ember-soft')}>
            <Bookmark className={cn('size-4', saved && 'save-pop fill-current text-ember')} aria-hidden />
          </button>
        </div>
      </header>

      {/* Photo */}
      <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-2xl border border-app-border bg-app-elevated sm:aspect-[21/9]">
        {restaurant.coverUrl ? (
          <Image src={restaurant.coverUrl} alt={restaurant.name} fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" priority />
        ) : (
          <div aria-hidden className="dot-grid absolute inset-0 flex items-center justify-center">
            <span className="font-display text-8xl font-bold text-app-muted/40">{initial}</span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="min-w-0 space-y-8">
          {/* Branch chooser */}
          {restaurant.branches.length > 1 && (
            <section aria-labelledby="branches-h">
              <h2 id="branches-h" className="text-lg font-bold text-app-fg">Choose a location</h2>
              <p className="mt-0.5 text-sm text-app-muted">Your reservation and directions follow the selected location.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2" role="group" aria-label="Choose a location">
                {restaurant.branches.map((b, idx) => {
                  const isSelected = selectedBranch === b.id
                  return (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedBranch(b.id)}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                        isSelected ? 'border-ember bg-ember-soft' : 'border-app-border bg-app-card hover:border-app-muted/50'
                      )}
                    >
                      <span aria-hidden className={cn('flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', isSelected ? 'bg-ember text-on-accent' : 'bg-app-alt text-app-muted')}>
                        {isSelected ? <Check className="size-3.5" strokeWidth={3} /> : idx + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-app-fg">{b.branchName}</span>
                        <span className="block truncate text-xs text-app-muted">{b.address || 'Address not provided'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* At a glance */}
          <section aria-labelledby="glance-h" className="overflow-hidden rounded-2xl border border-app-border bg-app-card">
            <h2 id="glance-h" className="sr-only">At a glance</h2>
            <dl className="grid divide-y divide-app-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4 sm:p-5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-app-muted"><MapPin className="size-3.5" aria-hidden />Address</dt>
                <dd className="mt-1.5 text-sm font-medium text-app-fg">{branch?.address || 'Location not provided'}</dd>
              </div>
              <div className="p-4 sm:p-5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-app-muted"><Clock3 className="size-3.5" aria-hidden />Today</dt>
                <dd className="mt-1.5 text-sm font-medium tabular-nums text-app-fg">{!hasHours ? 'Hours not provided' : todayRange ? `${todayRange.open} – ${todayRange.close}` : 'Closed today'}</dd>
              </div>
              <div className="p-4 sm:p-5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-app-muted"><Phone className="size-3.5" aria-hidden />Phone</dt>
                <dd className="mt-1.5 text-sm font-medium text-app-fg">
                  {branch?.phone ? (
                    <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`} className="tabular-nums text-ember underline-offset-4 hover:underline">{branch.phone}</a>
                  ) : 'Not provided'}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="about-h">
            <h2 id="about-h" className="text-2xl font-bold text-app-fg">About {restaurant.name}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-app-muted">
              {restaurant.description || 'Restaurant details have not been added yet.'}
            </p>
          </section>

          <section aria-labelledby="hours-h">
            <h2 id="hours-h" className="text-2xl font-bold text-app-fg">Opening hours</h2>
            {hasHours ? (
              <table className="mt-3 w-full max-w-md text-sm">
                <tbody className="divide-y divide-app-border border-y border-app-border">
                  {WEEK_DAYS.map((day) => {
                    const range = restaurant.openingHours?.[day]?.[0]
                    const isToday = day === todayKey
                    return (
                      <tr key={day} className={cn(isToday && 'bg-ember-soft')}>
                        <th scope="row" className={cn('py-2.5 pl-3 text-left font-medium', isToday ? 'font-bold text-app-fg' : 'text-app-muted')}>
                          {DAY_SHORT[day]}
                          {isToday && <span className="ml-2 text-xs font-semibold text-ember">Today</span>}
                        </th>
                        <td className={cn('py-2.5 pr-3 text-right tabular-nums', isToday ? 'font-bold text-app-fg' : 'text-app-muted')}>
                          {range ? `${range.open} – ${range.close}` : 'Closed'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-app-muted">Opening hours not provided.</p>
            )}
          </section>

          <Link href={`/restaurants/${restaurant.id}/menu`} className="glass glass-hover group flex items-center gap-4 rounded-2xl p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember"><Utensils className="size-5" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-app-fg">See the full menu</span>
              <span className="block text-sm text-app-muted">Dishes and prices published by the restaurant.</span>
            </span>
            <ChevronRight className="size-5 text-app-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {/* Booking column */}
        <aside aria-label="Reserve and get there">
          <div className="space-y-4 lg:sticky lg:top-24">
            <div id="reserve" className="scroll-mt-24">
              {branch ? (
                <ReservationForm restaurant={restaurant} branch={branch} key={branch.id} />
              ) : (
                <div className="rounded-2xl border border-dashed border-app-border bg-app-alt p-5 text-sm text-app-muted">
                  This venue hasn&apos;t added booking locations yet — check back soon.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-app-border bg-app-card p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember"><CarFront className="size-5" aria-hidden /></span>
                <div className="min-w-0">
                  <p className="font-semibold text-app-fg">Getting there</p>
                  <p className="mt-0.5 truncate text-sm text-app-muted">{branch?.address || 'Location not provided'}</p>
                </div>
              </div>
              <Link href={rideHref} className="btn-secondary mt-4 w-full">
                <Navigation className="size-4" aria-hidden />
                Estimate a ride here
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile thumb-zone CTA: reserve + ride (desktop has the sticky panel) */}
      <StickyActionBar
        className="sm:hidden"
        primary={{
          label: 'Book a Table',
          onClick: () =>
            document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' }),
        }}
        secondary={{ label: 'Go by Ride', href: rideHref }}
      />
    </div>
  )
}
