'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  CalendarPlus,
  CarFront,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Share2,
  Star,
  Utensils,
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

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <Link
        href="/restaurants"
        className="mb-4 inline-flex items-center gap-2 glass-subtle rounded-xl px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
      >
        <ArrowLeft className="size-4 text-ember" strokeWidth={2.5} />
        Back to restaurants
      </Link>

      {/* Hero */}
      <div className="relative h-64 overflow-hidden rounded-3xl shadow-glass-strong sm:h-[380px]">
        {restaurant.coverUrl ? (
          <Image
            src={restaurant.coverUrl}
            alt={restaurant.name}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(140deg,rgb(var(--amber-rgb)/0.5),rgb(var(--ember-deep-rgb)/0.95))]">
            <span className="text-6xl font-bold text-white">{initial}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(15,13,11,0.5))]" aria-hidden />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            aria-label="Share"
            onClick={() => {
              sharePage(restaurant.name, `/restaurants/${restaurant.id}`).then(
                (r) => {
                  if (r === 'copied') {
                    setShareStatus('copied')
                    window.setTimeout(() => setShareStatus('idle'), 2000)
                  }
                },
              )
            }}
            className="flex size-11 items-center justify-center rounded-full border border-app-border bg-app-card text-app-fg transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-90"
          >
            {shareStatus === 'copied' ? <Check className="size-4" strokeWidth={2.5} /> : <Share2 className="size-4" strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            aria-label="Save"
            onClick={toggleSaved}
              className={cn(
                'flex size-11 items-center justify-center rounded-full border border-app-border transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-90',
                saved ? 'bg-ember text-on-accent' : 'bg-app-card text-app-fg'
              )}
          >
            <Bookmark className={cn('size-4', saved && 'fill-current')} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Identity card overlapping hero */}
      <div className="relative z-10 mx-auto -mt-14 max-w-3xl px-4 sm:px-0">
        <div className="glass rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-app-border bg-app-input">
                {restaurant.logoUrl ? (
                  <Image src={restaurant.logoUrl} alt={restaurant.name} width={56} height={56} className="size-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-ember">{initial}</span>
                )}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-app-fg sm:text-3xl">{restaurant.name}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-app-muted">
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-ember text-ember" />
                    <span className="font-bold text-app-fg">{restaurant.rating ?? 'New'}</span>
                  </span>
                  {restaurant.category && <>
                    <span aria-hidden>·</span>
                    <span className="font-medium capitalize">{restaurant.category}</span>
                  </>}
                </p>
              </div>
            </div>
            {restaurant.isVerified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                <BadgeCheck className="size-4" />
                Verified
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4">
            <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-app-muted">
              <MapPin className="size-4 shrink-0 text-ember" strokeWidth={2.5} />
              <span className="truncate">{branch?.address || 'Location not provided'}</span>
            </p>
            <Link
              href={`/ride?to=${encodeURIComponent(restaurant.name)}${branch?.latitude != null && branch?.longitude != null ? `&lat=${branch.latitude}&lng=${branch.longitude}` : ''}`}
              className="inline-flex items-center gap-1.5 glass-subtle rounded-xl px-4 py-2 text-sm font-semibold text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
            >
              <Navigation className="size-4 text-ember" strokeWidth={2.5} />
              Directions
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mx-auto mt-5 grid max-w-3xl grid-cols-3 gap-3 px-4 sm:px-0">
        {[
          { label: 'View Menu', icon: Utensils, href: `/restaurants/${restaurant.id}/menu` },
          { label: 'Reserve', icon: CalendarPlus, href: '#reserve' },
          { label: 'Save', icon: Bookmark, active: saved },
        ].map(({ label, icon: Icon, href, active }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className={cn(
                'glass glass-hover flex flex-col items-center gap-1.5 rounded-2xl py-4 text-xs font-semibold text-app-fg',
                label === 'View Menu' && 'border-ember bg-ember text-on-accent shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)]'
              )}
            >
              <Icon className={cn('size-5', label === 'View Menu' ? 'text-on-accent' : 'text-ember')} strokeWidth={2.5} />
              {label}
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              onClick={toggleSaved}
              className={cn(
                'glass glass-hover flex flex-col items-center gap-1.5 rounded-2xl py-4 text-xs font-semibold',
                active ? 'bg-ember text-on-accent' : 'text-app-fg'
              )}
            >
              <Icon className={cn('size-5', active ? 'fill-current text-white' : 'text-ember')} strokeWidth={2.5} />
              {label}
            </button>
          )
        )}
      </div>

      {/* Branches strip */}
      {restaurant.branches.length > 1 && (
        <div className="mx-auto mt-5 flex max-w-3xl gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-0">
          {restaurant.branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBranch(b.id)}
              className={cn(
                'glass glass-hover flex w-56 shrink-0 items-center justify-between gap-2 rounded-2xl p-3 text-left transition-all duration-200',
                selectedBranch === b.id ? 'bg-ember text-on-accent' : 'text-app-fg'
              )}
            >
              <span className="min-w-0">
                <span className={cn('block truncate text-sm font-semibold', selectedBranch === b.id ? 'text-white' : 'text-app-fg')}>{b.branchName}</span>
                <span className={cn('block truncate text-xs font-medium', selectedBranch === b.id ? 'text-white/80' : 'text-app-muted')}>{b.address}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="mx-auto mt-6 grid max-w-5xl gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left */}
        <div>
          {/* Restaurant supplied details */}
          <div className="grid gap-4">
            <div className="rounded-2xl border border-app-border bg-app-card p-5 shadow-card">
              <h3 className="text-lg font-bold text-app-fg">About {restaurant.name}</h3>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                {restaurant.description || 'Restaurant details have not been added yet.'}
              </p>
              {restaurant.category && <div className="mt-3 flex flex-wrap gap-2">
                <span className="sticker sticker-ember !rotate-0 !py-1 !text-[10px]">
                  {restaurant.category}
                </span>
              </div>}

              {/* Per-day opening hours with today highlighted (Stitch artboard pattern) */}
              <div className="mt-5 flex gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-ember" strokeWidth={2.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-fg">
                    OPENING HOURS
                  </p>
                  {restaurant.openingHours && Object.keys(restaurant.openingHours).length > 0 ? (
                    <table className="mt-1.5 w-full max-w-[260px] text-sm">
                      <tbody>
                        {WEEK_DAYS.map((day) => {
                          const range = restaurant.openingHours?.[day]?.[0]
                          const isToday = day === todayKey
                          return (
                            <tr
                              key={day}
                              className={cn(isToday && '-mx-2 rounded-lg border border-app-border bg-ember/12')}
                            >
                              <td
                                className={cn(
                                  'py-1 pl-2 pr-3 text-left',
                                  isToday ? 'font-bold text-app-fg' : 'text-app-muted'
                                )}
                              >
                                {DAY_SHORT[day]}
                                {isToday && <span className="sr-only"> (today)</span>}
                              </td>
                              <td
                                className={cn(
                                  'py-1 pr-2 text-right tabular-nums',
                                  isToday ? 'font-bold text-app-fg' : 'text-app-muted'
                                )}
                              >
                                {range ? `${range.open} – ${range.close}` : 'Closed'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="mt-0.5 text-sm text-app-muted">Opening hours not provided.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right — reserve + ride */}
        <div>
          <div className="lg:sticky lg:top-20">
            <div id="reserve" className="scroll-mt-24">
              {branch ? (
                <ReservationForm restaurant={restaurant} branch={branch} key={branch.id} />
              ) : (
                <div className="rounded-2xl border border-app-border bg-app-card p-5 text-sm text-app-muted shadow-card">
                  This venue hasn&apos;t added booking locations yet — check back soon.
                </div>
              )}
            </div>

            {/* Ride card */}
            <div className="mt-4 overflow-hidden glass rounded-2xl">
              <div className="dot-grid flex h-32 items-center justify-center border-b-[1.5px] border-app-border bg-app-input">
                <span className="flex items-center gap-2 text-sm font-bold text-app-muted">
                  <MapPin className="size-5 text-ember" strokeWidth={2.5} />
                  {branch?.address || 'Location not provided'}
                </span>
              </div>
              <div className="p-4">
                <p className="text-base font-bold text-app-fg">Getting there</p>
                <p className="mt-0.5 text-xs font-medium text-app-muted">
                  Compare rides and arrive on time.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/ride?to=${encodeURIComponent(restaurant.name)}${branch?.latitude != null && branch?.longitude != null ? `&lat=${branch.latitude}&lng=${branch.longitude}` : ''}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-ember to-ember-deep py-2.5 text-xs font-semibold uppercase tracking-wider text-on-accent shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  >
                    <Navigation className="size-3.5" strokeWidth={2.5} />
                    Go
                  </Link>
                  <Link
                    href={`/ride?to=${encodeURIComponent(restaurant.name)}${branch?.latitude != null && branch?.longitude != null ? `&lat=${branch.latitude}&lng=${branch.longitude}` : ''}`}
                    className="glass-subtle flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
                  >
                    <CarFront className="size-3.5 text-ember" strokeWidth={2.5} />
                    Book Ride
                  </Link>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-app-muted">
                  <Check className="size-3.5 text-success" strokeWidth={2.5} />
                  Instant confirmation · No prepayment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile thumb-zone CTA: reserve + ride (desktop has the sticky panel) */}
      <StickyActionBar
        className="sm:hidden"
        primary={{
          label: 'Book a Table',
          onClick: () =>
            document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' }),
        }}
        secondary={{ label: 'Go by Ride', href: `/ride?to=${encodeURIComponent(restaurant.name)}${branch?.latitude != null && branch?.longitude != null ? `&lat=${branch.latitude}&lng=${branch.longitude}` : ''}` }}
      />
    </div>
  )
}
