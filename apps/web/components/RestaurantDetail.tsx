'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  CalendarPlus,
  CarFront,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Share2,
  Star,
  UserPlus,
  Utensils,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ReservationForm } from '@/components/reservation-form'
import { StickyActionBar } from '@/components/patterns'
import type { RestaurantDetail as Restaurant, DetailBranch as Branch } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

const PHOTO_POOL = ['/places/food-1.jpg', '/places/food-2.jpg', '/places/food-3.jpg']

export default function RestaurantDetail({ restaurant }: { restaurant: Restaurant }) {
  const [selectedBranch, setSelectedBranch] = useState(restaurant.branches[0]?.id ?? null)
  const [followed, setFollowed] = useState(false)
  const [saved, setSaved] = useState(false)
  const branch = restaurant.branches.find((b) => b.id === selectedBranch) ?? restaurant.branches[0]
  const menuCategories = branch?.menuItems
    ? [...new Set(branch.menuItems.map((item) => item.category))]
    : []
  const initial = restaurant.name.charAt(0).toUpperCase()

  const photos = [
    ...(restaurant.coverUrl ? [restaurant.coverUrl] : []),
    ...PHOTO_POOL,
  ].slice(0, 4)

  const highlights = ['Rooftop Dining', 'Live Music', 'Signature Cocktails']
  const hoursLabel = restaurant.openingHours?.mon?.[0]
    ? `Mon - Sun: ${restaurant.openingHours.mon[0].open} - ${restaurant.openingHours.mon[0].close}`
    : 'Open daily'

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <Link
        href="/restaurants"
        className="mb-4 inline-flex items-center gap-2 text-sm text-app-muted transition-colors hover:text-app-fg"
      >
        <ArrowLeft className="size-4" />
        Back to restaurants
      </Link>

      {/* Hero */}
      <div className="relative h-64 overflow-hidden rounded-xl sm:h-[380px]">
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
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(140deg,rgba(194,168,120,0.35),rgba(11,31,58,0.95))]">
            <span className="font-serif text-6xl font-bold text-gold-soft/90">{initial}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,31,58,0.55))]" aria-hidden />
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            type="button"
            aria-label="Share"
            className="flex size-11 items-center justify-center rounded-full bg-app-card/90 text-app-fg shadow-sm transition-transform active:scale-90"
          >
            <Share2 className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Save"
            onClick={() => setSaved((v) => !v)}
              className={cn(
                'flex size-11 items-center justify-center rounded-full shadow-sm transition-transform active:scale-90',
                saved ? 'bg-gold text-navy' : 'bg-app-card/90 text-app-fg'
              )}
          >
            <Bookmark className={cn('size-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>

      {/* Identity card overlapping hero */}
      <div className="relative z-10 mx-auto -mt-14 max-w-3xl px-4 sm:px-0">
        <div className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-lg)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-app-border bg-app-input">
                {restaurant.logoUrl ? (
                  <Image src={restaurant.logoUrl} alt={restaurant.name} width={56} height={56} className="size-full object-cover" />
                ) : (
                  <span className="font-serif text-2xl font-bold text-gold-soft">{initial}</span>
                )}
              </span>
              <div>
                <h1 className="font-serif text-2xl font-bold text-app-fg">{restaurant.name}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-app-muted">
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-gold text-gold" />
                    <span className="font-semibold text-app-fg">{restaurant.rating ?? 'New'}</span>
                  </span>
                  <span aria-hidden>·</span>
                  <span className="capitalize">{restaurant.category ?? 'Restaurant'}</span>
                </p>
              </div>
            </div>
            <span className="rounded-md bg-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gold dark:bg-gold dark:text-navy">
              ★ Premium
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4">
            <p className="flex min-w-0 items-center gap-2 text-sm text-app-muted">
              <MapPin className="size-4 shrink-0 text-gold-soft" />
              <span className="truncate">{branch?.address ?? 'Addis Ababa'}</span>
            </p>
            <Link
              href={`/ride?to=${encodeURIComponent(restaurant.name)}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-app-border px-4 py-2 text-sm font-medium text-app-fg transition-colors hover:border-gold/50"
            >
              <Navigation className="size-4 text-gold-soft" />
              Directions
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mx-auto mt-5 grid max-w-3xl grid-cols-4 gap-3 px-4 sm:px-0">
        {[
          { label: 'Menu', icon: Utensils, href: '#menu' },
          { label: 'Reserve', icon: CalendarPlus, href: '#reserve' },
          { label: 'Follow', icon: UserPlus, toggle: true, active: followed },
          { label: 'Save', icon: Bookmark, toggle: true, active: saved },
        ].map(({ label, icon: Icon, href, toggle, active }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-app-border bg-app-card py-4 text-xs font-medium text-app-fg shadow-[var(--shadow-sm)] transition-all hover:border-gold/50 hover:shadow-[var(--shadow-md)] active:scale-[0.97]"
            >
              <Icon className="size-5 text-gold-soft" />
              {label}
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              onClick={() =>
                label === 'Follow' ? setFollowed((v) => !v) : setSaved((v) => !v)
              }
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border py-4 text-xs font-medium shadow-[var(--shadow-sm)] transition-all active:scale-[0.97]',
                active
                  ? 'border-gold/60 bg-gold/10 text-gold-soft'
                  : 'border-app-border bg-app-card text-app-fg hover:border-gold/50'
              )}
            >
              <Icon className={cn('size-5', active ? 'fill-current text-gold-soft' : 'text-gold-soft')} />
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
                'flex w-56 shrink-0 items-center justify-between gap-2 rounded-lg border p-3 text-left transition-all active:scale-[0.98]',
                selectedBranch === b.id
                  ? 'border-gold/60 bg-gold/10'
                  : 'border-app-border bg-app-card hover:border-gold/40'
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-app-fg">{b.branchName}</span>
                <span className="block truncate text-xs text-app-muted">{b.address}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="mx-auto mt-6 grid max-w-5xl gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left */}
        <div>
          {/* Photos */}
          <div className="rounded-xl border border-app-border bg-app-card p-4 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-app-fg">Photos & Videos</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-soft">
                View all ›
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((src, i) => (
                <div key={`${src}-${i}`} className="relative aspect-square overflow-hidden rounded-lg bg-app-input">
                  <Image
                    src={src}
                    alt={`${restaurant.name} photo ${i + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* About + Highlights */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-sm)]">
              <h3 className="font-semibold text-app-fg">About {restaurant.name}</h3>
              <p className="mt-2 text-sm leading-6 text-app-muted">
                {restaurant.name} offers a curated {restaurant.category ?? 'signature'} dining
                experience in {branch?.address ?? 'Addis Ababa'}. Reservations, menus and
                directions — all in one place.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ivory dark:bg-navy dark:text-gold">
                  {restaurant.category ?? 'Restaurant'}
                </span>
                <span className="rounded-md bg-app-input px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-app-muted">
                  Dining
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-sm)]">
              {[
                { icon: Star, title: 'HIGHLIGHTS', body: highlights.join(' • ') },
                { icon: CarFront, title: 'PARKING', body: 'Valet Available • Free Parking' },
                { icon: Clock3, title: 'OPENING HOURS', body: hoursLabel },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className={cn('flex gap-3', title !== 'OPENING HOURS' && 'mb-4')}>
                  <Icon className="mt-0.5 size-4 shrink-0 text-gold-soft" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-app-fg">
                      {title}
                    </p>
                    <p className="mt-0.5 text-sm text-app-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu */}
          {branch?.menuItems && branch.menuItems.length > 0 && (
            <div id="menu" className="mt-5 scroll-mt-24">
              <h2 className="mb-3 font-serif text-2xl font-bold">Menu</h2>
              <div className="space-y-5 rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-sm)]">
                {menuCategories.map((category) => (
                  <div key={category}>
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-gold-soft">
                      {category}
                    </div>
                    <div className="space-y-2">
                      {branch.menuItems
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 border-b border-app-border py-2.5 last:border-0"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-app-fg">{item.name}</div>
                              <div className={cn('text-xs', item.isAvailable ? 'text-success' : 'text-app-muted')}>
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                              </div>
                            </div>
                            <div className="shrink-0 text-sm font-semibold tabular-nums text-app-fg">
                              ETB {item.price}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — reserve + ride */}
        <div>
          <div className="lg:sticky lg:top-20">
            <div id="reserve" className="scroll-mt-24">
              <ReservationForm restaurant={restaurant} branch={branch} key={branch.id} />
            </div>

            {/* Ride card */}
            <div className="mt-4 overflow-hidden rounded-xl border border-app-border bg-app-card shadow-[var(--shadow-sm)]">
              <div className="flex h-32 items-center justify-center bg-app-input">
                <span className="flex items-center gap-2 text-sm text-app-muted">
                  <MapPin className="size-5 text-gold-soft" />
                  {branch?.address ?? 'Addis Ababa'}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-app-fg">Getting there</p>
                <p className="mt-0.5 text-xs text-app-muted">
                  Compare rides and arrive on time.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/ride?to=${encodeURIComponent(restaurant.name)}`}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-gold py-2.5 text-xs font-bold uppercase tracking-wider text-navy transition-transform active:scale-[0.98]"
                  >
                    <Navigation className="size-3.5" />
                    Go
                  </Link>
                  <Link
                    href={`/ride?to=${encodeURIComponent(restaurant.name)}`}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-app-border py-2.5 text-xs font-bold uppercase tracking-wider text-app-fg transition-transform active:scale-[0.98]"
                  >
                    <CarFront className="size-3.5" />
                    Book Ride
                  </Link>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-app-muted">
                  <Check className="size-3.5 text-success" />
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
        secondary={{ label: 'Go by Ride', href: `/ride?to=${encodeURIComponent(restaurant.name)}` }}
      />
    </div>
  )
}
