'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  MapPin,
  Share2,
  Star,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ListingCardLarge } from '@/components/patterns/ListingCard'
import { SectionHeader } from '@/components/patterns/SectionHeader'
import { StickyActionBar } from '@/components/patterns/StickyActionBar'
import { cn } from '@/lib/utils'
import type { OrganizerDetail } from '@/lib/supabase/queries'

function dateParts(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { day: '–', month: 'TBA', time: '' }
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    time: d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Date TBA'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

function formatFollowers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export default function OrganizerProfile({ organizer }: { organizer: OrganizerDetail }) {
  const [followed, setFollowed] = useState(false)

  const upcoming = useMemo(
    () => [...organizer.events].sort((a, b) => a.startDateTime.localeCompare(b.startDateTime)),
    [organizer.events]
  )
  const nextEvent = upcoming[0]
  const categories = useMemo(
    () => [...new Set(organizer.events.map((e) => e.category).filter(Boolean))],
    [organizer.events]
  )
  const initials = organizer.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <Link
        href="/events"
        className="mb-4 inline-flex items-center gap-2 text-sm text-app-muted transition-colors hover:text-app-fg"
      >
        <ArrowLeft className="size-4" />
        Back to events
      </Link>

      {/* Cover */}
      <div className="relative h-52 overflow-hidden rounded-xl sm:h-72">
        {organizer.coverUrl ? (
          <Image
            src={organizer.coverUrl}
            alt={organizer.name}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(140deg,rgba(194,168,120,0.35),rgba(11,31,58,0.95))]">
            <span className="font-serif text-7xl font-bold text-gold-soft/90">{initials}</span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,31,58,0.5))]"
          aria-hidden
        />
        <button
          type="button"
          aria-label="Share"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-app-card/90 text-app-fg shadow-sm transition-transform active:scale-90"
        >
          <Share2 className="size-4" />
        </button>
      </div>

      {/* Hero split: identity + next event */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        {/* Identity */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-app-border bg-app-input">
                {organizer.logoUrl ? (
                  <Image
                    src={organizer.logoUrl}
                    alt={organizer.name}
                    width={64}
                    height={64}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-2xl font-bold text-gold-soft">{initials}</span>
                )}
              </span>
              <div className="min-w-0">
                <h1 className="flex items-center gap-1.5 font-serif text-2xl font-bold text-app-fg">
                  <span className="truncate">{organizer.name}</span>
                  {organizer.isVerified && (
                    <BadgeCheck className="size-5 shrink-0 text-gold" aria-label="Verified" />
                  )}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-app-muted">
                  <MapPin className="size-4 shrink-0 text-gold-soft" />
                  <span className="truncate">{organizer.city}</span>
                </p>
              </div>
            </div>

            {organizer.bio && (
              <p className="mt-4 border-t border-app-border pt-4 text-sm leading-6 text-app-muted">
                {organizer.bio}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFollowed((v) => !v)}
                className={cn(
                  'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-all active:scale-[0.98]',
                  followed
                    ? 'bg-gold/15 text-gold-soft ring-1 ring-gold/40'
                    : 'bg-navy text-ivory dark:bg-gold dark:text-navy'
                )}
                aria-pressed={followed}
              >
                <Users className={cn('size-4', followed && 'fill-current')} />
                {followed ? 'Following' : 'Follow'}
              </button>
              <span className="flex items-center gap-1.5 rounded-2xl border border-app-border px-4 py-3 text-sm font-semibold text-app-fg">
                <Star className="size-4 fill-gold text-gold" />
                {organizer.rating ?? 'New'}
              </span>
            </div>
          </div>
        </div>

        {/* Featured next event — the thesis */}
        {nextEvent && (
          <Link
            href={`/events/${nextEvent.id}`}
            className="group relative flex min-h-[16rem] flex-col justify-end overflow-hidden rounded-xl border border-app-border bg-app-card shadow-[var(--shadow-lg)] transition-all hover:border-gold/40"
          >
            {nextEvent.coverImageUrl ? (
              <Image
                src={nextEvent.coverImageUrl}
                alt={nextEvent.title}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(215,183,120,0.3),rgba(11,29,49,0.95))]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(11,31,58,0.82))]" aria-hidden />
            <div className="relative p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-soft">
                Next up
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-ivory sm:text-3xl">
                {nextEvent.title}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ivory/80">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-gold-soft" />
                  {formatWhen(nextEvent.startDateTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-gold-soft" />
                  {nextEvent.venueName}
                </span>
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gold px-5 py-3 text-sm font-bold text-navy transition-transform group-active:scale-[0.98]">
                {nextEvent.priceFrom != null ? `Book from ETB ${nextEvent.priceFrom}` : 'Book now'}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Signature: date ribbon */}
      {upcoming.length > 0 && (
        <section className="mt-8" aria-label="Upcoming event dates">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gold-soft">
            Their calendar
          </p>
          <div className="relative overflow-hidden">
            <div className="flex w-max gap-3 motion-safe:animate-[ribbon-scroll_38s_linear_infinite]">
              {[...upcoming, ...upcoming].map((e, i) => {
                const { day, month, time } = dateParts(e.startDateTime)
                return (
                  <Link
                    key={`${e.id}-${i}`}
                    href={`/events/${e.id}`}
                    className="group flex w-44 shrink-0 items-center gap-3 rounded-2xl border border-app-border bg-app-card p-3 transition-all hover:border-gold/50 hover:shadow-[var(--shadow-md)]"
                  >
                    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-navy text-ivory dark:bg-gold/15 dark:text-gold-soft">
                      <span className="text-[10px] font-bold tracking-widest">{month}</span>
                      <span className="font-serif text-xl font-bold leading-none">{day}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-app-fg group-hover:text-gold-soft">
                        {e.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-app-muted">{time}</span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quiet stats */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: 'Events', value: String(organizer.events.length) },
          { label: 'Followers', value: formatFollowers(organizer.followerCount) },
          { label: 'Rating', value: organizer.rating ?? '—' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-app-border bg-app-card px-4 py-4 text-center"
          >
            <p className="font-serif text-2xl font-bold text-app-fg">{s.value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-app-muted">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <section id="events" className="mt-10 scroll-mt-20">
        <SectionHeader
          eyebrow="What's on"
          title="Upcoming events"
          href="/events"
          actionLabel="All events"
        />
        {upcoming.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <ListingCardLarge
                key={e.id}
                type="events"
                href={`/events/${e.id}`}
                item={{
                  id: e.id,
                  name: e.title,
                  category: e.category,
                  location: e.venueName,
                  detail: formatWhen(e.startDateTime),
                  rating: e.priceFrom != null ? `From ETB ${e.priceFrom}` : 'Free',
                  imageUrl: e.coverImageUrl,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-app-border bg-app-panel/50 px-6 py-14 text-center">
            <h3 className="font-serif text-lg font-bold text-app-fg">No events yet</h3>
            <p className="mt-1.5 text-sm text-app-muted">
              {organizer.name} hasn’t published anything. Follow to get notified when they do.
            </p>
          </div>
        )}
      </section>

      {/* About + tags */}
      {organizer.bio && (
        <section className="mt-10">
          <SectionHeader eyebrow="The short version" title="About" />
          <div className="rounded-xl border border-app-border bg-app-card p-5 shadow-[var(--shadow-sm)]">
            <p className="text-sm leading-6 text-app-muted">{organizer.bio}</p>
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-app-border pt-4">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-app-input px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-app-muted"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <StickyActionBar
        primary={{
          label: followed ? 'Following' : 'Follow',
          onClick: () => setFollowed((v) => !v),
        }}
        secondary={{ label: 'View events', href: '#events' }}
      />
    </div>
  )
}
