'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Baby,
  CalendarDays,
  Coins,
  Globe2,
  Heart,
  Music2,
  MapPin,
  PartyPopper,
  Search,
  SearchX,
  SlidersHorizontal,
  Star,
  Ticket,
  Utensils,
  Wine,
  X,
} from 'lucide-react'
import type { CatalogueItem } from '@/lib/catalogue'
import { CategoryChips, EmptyState, FilterSheet } from '@/components/patterns'
import { DateBadge, dateBadgeParts } from '@/components/patterns/DateBadge'
import { cn } from '@/lib/utils'

const quickChips = {
  restaurants: ['All', 'Ethiopian', 'Italian', 'Japanese', 'International', 'European', 'Café'],
  events: ['All', 'Music', 'Food & Drink', 'Networking', 'Theatre'],
} as const

const dateChips = ['All Dates', 'This Weekend', 'Next Week'] as const

const filterGroups = {
  restaurants: [
    {
      key: 'cuisine',
      title: 'Cuisine',
      options: [
        { label: 'Ethiopian', icon: <Utensils className="size-4" /> },
        { label: 'Italian', icon: <Utensils className="size-4" /> },
        { label: 'Japanese', icon: <Utensils className="size-4" /> },
        { label: 'International', icon: <Utensils className="size-4" /> },
        { label: 'European', icon: <Utensils className="size-4" /> },
        { label: 'Middle Eastern', icon: <Utensils className="size-4" /> },
      ],
    },
    {
      key: 'vibe',
      title: 'Vibe',
      options: [
        { label: 'Live music', icon: <Music2 className="size-4" /> },
        { label: 'Rooftop', icon: <Star className="size-4" /> },
        { label: 'Outdoor seating', icon: <Star className="size-4" /> },
        { label: 'Fine dining', icon: <Star className="size-4" /> },
      ],
    },
    {
      key: 'budget',
      title: 'Budget',
      options: [
        { label: 'Student friendly', icon: <Coins className="size-4" /> },
        { label: 'Budget friendly', icon: <Coins className="size-4" /> },
        { label: 'Fine dining', icon: <Coins className="size-4" /> },
      ],
    },
  ],
  events: [
    {
      key: 'type',
      title: 'Event type',
      options: [
        { label: 'Concerts', icon: <Music2 className="size-4" /> },
        { label: 'Brunch', icon: <Utensils className="size-4" /> },
        { label: 'Parties', icon: <PartyPopper className="size-4" /> },
        { label: 'Networking', icon: <Globe2 className="size-4" /> },
        { label: 'Theatre', icon: <Ticket className="size-4" /> },
        { label: 'Food & Drink', icon: <Wine className="size-4" /> },
      ],
    },
    {
      key: 'audience',
      title: 'Audience',
      options: [
        { label: 'Kids friendly', icon: <Baby className="size-4" /> },
        { label: 'Family events', icon: <Baby className="size-4" /> },
        { label: 'Tourists', icon: <Globe2 className="size-4" /> },
        { label: 'Must visit', icon: <Star className="size-4" /> },
      ],
    },
    {
      key: 'budget',
      title: 'Budget',
      options: [
        { label: 'Free', icon: <Coins className="size-4" /> },
        { label: 'Budget friendly', icon: <Coins className="size-4" /> },
        { label: 'Premium', icon: <Coins className="size-4" /> },
      ],
    },
  ],
} as const

function matchesFilters(item: CatalogueItem, selected: Record<string, string[]>) {
  const haystack = `${item.name} ${item.category} ${item.location} ${item.detail}`.toLowerCase()
  const active = Object.values(selected).flat()
  if (!active.length) return true
  return active.some((label) => {
    const words = label.toLowerCase().split(/\s+/)
    return words.some((word) => haystack.includes(word))
  })
}

function matchesDateRange(item: CatalogueItem, range: (typeof dateChips)[number]) {
  if (range === 'All Dates' || !item.startsAt) return true
  const date = new Date(item.startsAt)
  if (Number.isNaN(date.getTime())) return true
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() + (range === 'This Weekend' ? 0 : 7))
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + (range === 'This Weekend' ? 7 : 7))
  return date >= start && date <= end
}

function eventParts(item: CatalogueItem) {
  const match = item.detail.match(/,\s*(\w{3})\s+(\d{1,2})/)
  return {
    month: match ? match[1].toUpperCase() : 'SOON',
    day: match ? match[2] : '·',
  }
}

const PAGE_SIZE = 6

export default function ExploreCatalogue({
  type,
  items,
  source,
  initialQuery = '',
}: {
  type: 'restaurants' | 'events'
  items: CatalogueItem[]
  source: 'live' | 'sample'
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery))
  const [saved, setSaved] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [dateRange, setDateRange] = useState<(typeof dateChips)[number]>('All Dates')
  const [sortDesc, setSortDesc] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const text = `${item.name} ${item.category} ${item.location}`.toLowerCase()
      const queryMatch = text.includes(query.toLowerCase())
      const chipMatch =
        activeFilter === 'All' ||
        item.category.toLowerCase().includes(activeFilter.toLowerCase()) ||
        item.name.toLowerCase().includes(activeFilter.toLowerCase())
      return (
        queryMatch &&
        chipMatch &&
        matchesFilters(item, selected) &&
        (type === 'restaurants' || matchesDateRange(item, dateRange))
      )
    })
    if (type === 'restaurants') {
      return [...filtered].sort((a, b) => {
        const ra = Number(a.rating) || 0
        const rb = Number(b.rating) || 0
        return sortDesc ? rb - ra : ra - rb
      })
    }
    return filtered
  }, [items, query, activeFilter, selected, dateRange, sortDesc, type])

  const featured = visibleItems[0]
  const rest = visibleItems.slice(1, visible + 1)
  const hasMore = visibleItems.length > visible + 1

  function toggleFilter(groupKey: string, label: string) {
    setSelected((current) => {
      const group = current[groupKey] ?? []
      const next = group.includes(label)
        ? group.filter((v) => v !== label)
        : [...group, label]
      return { ...current, [groupKey]: next }
    })
  }

  const activeCount = Object.values(selected).flat().length

  return (
    <section className="pb-24">
      {type === 'restaurants' ? (
        <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft">Dining guide</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-serif text-4xl font-bold leading-tight text-app-fg sm:text-5xl">
              Find a table worth remembering.
            </h1>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-app-border bg-app-card px-4 text-sm font-semibold text-app-fg shadow-soft transition hover:border-gold/50"
              aria-expanded={searchOpen}
            >
              <Search className="size-4 text-gold-soft" />
              Search restaurants
            </button>
          </div>
          <p className="mt-3 max-w-xl text-base text-app-muted">
            Discover trusted places for every kind of gathering, from quick lunches to special evenings.
          </p>
          {searchOpen && (
            <div className="mt-5 flex max-w-xl items-center gap-3 rounded-xl border border-app-border bg-app-card px-3 shadow-soft">
              <Search className="size-[18px] shrink-0 text-gold-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-app-fg outline-none placeholder:text-app-muted"
                placeholder="Restaurant, cuisine, or neighbourhood"
                aria-label="Search restaurants"
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSearchOpen(false)
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-app-muted transition hover:bg-app-input hover:text-app-fg"
                aria-label="Close restaurant search"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft">What’s on</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">Your next great night out.</h1>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-app-border bg-app-card px-4 text-sm font-semibold text-app-fg shadow-soft transition hover:border-gold/50"
              aria-expanded={searchOpen}
            >
              <Search className="size-4 text-gold-soft" />
              Search
            </button>
          </div>
          <p className="mt-3 max-w-xl text-base text-app-muted">
            Discover and book premium experiences, from intimate jazz nights to grand
            galas. Arrive in style with UrbanExplore.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {searchOpen && (
              <div className="flex min-h-11 min-w-[min(100%,22rem)] flex-1 items-center gap-2.5 rounded-xl border border-app-border bg-app-card px-3 shadow-soft">
              <Search className="size-[18px] shrink-0 text-gold-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-app-fg outline-none placeholder:text-app-muted"
                placeholder="Search events..."
                aria-label="Search events"
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSearchOpen(false)
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-app-muted transition hover:bg-app-input hover:text-app-fg"
                aria-label="Close event search"
              >
                <X className="size-4" />
              </button>
            </div>
            )}
            <div className="flex shrink-0 flex-wrap gap-2">
              {dateChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDateRange(chip)}
                  className={cn(
                    'min-h-10 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors',
                    dateRange === chip
                      ? 'bg-navy text-ivory'
                      : 'border border-app-border text-app-muted hover:text-app-fg'
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Chips + sort row */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            type === 'restaurants' ? 'mt-6' : 'mt-5'
          )}
        >
          <CategoryChips
            items={quickChips[type].map((label) => ({ label }))}
            active={activeFilter}
            onSelect={(label) => {
              setActiveFilter(label)
              setVisible(PAGE_SIZE)
            }}
            className="flex-1"
          />
          {type === 'restaurants' && (
            <button
              type="button"
              onClick={() => setSortDesc((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-app-border px-3.5 py-2 text-xs font-semibold text-app-muted transition-colors hover:text-app-fg"
            >
              {sortDesc ? 'Rating ↓' : 'Rating ↑'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors',
              filtersOpen || activeCount
                ? 'border-gold/60 bg-gold/10 text-gold-soft'
                : 'border-app-border text-app-muted hover:text-app-fg'
            )}
            aria-label="Filters"
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-navy">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <FilterSheet
          groups={filterGroups[type] as unknown as Parameters<typeof FilterSheet>[0]['groups']}
          selected={selected}
          onToggle={toggleFilter}
          onClear={() => setSelected({})}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          resultCount={visibleItems.length}
        />

        {source === 'sample' && (
          <p className="mt-5 text-sm text-app-muted">
            Showing sample listings while live data is being set up.
          </p>
        )}

        {/* Featured card */}
        {featured && (
          <div className="mt-6">
            {type === 'restaurants' ? (
              <Link
                href={`/restaurants/${featured.id}`}
                className="group relative block min-h-[300px] overflow-hidden rounded-xl"
              >
                {featured.imageUrl ? (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(194,168,120,0.4),rgba(11,31,58,0.95))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(11,31,58,0.92))]" />
                <span className="absolute left-5 top-5 rounded bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">
                  Featured
                </span>
                <span className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-semibold text-gold backdrop-blur-sm">
                  <Star className="size-3 fill-current" />
                  {featured.rating}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6">
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-white">{featured.name}</h2>
                    <p className="mt-1 text-sm text-white/75">
                      {featured.category} · {featured.detail} · {featured.location}
                    </p>
                  </div>
                  <span className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-transform group-hover:scale-[1.03]">
                    Reserve Table
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href={`/events/${featured.id}`}
                className="group relative block min-h-[300px] overflow-hidden rounded-xl"
              >
                {featured.imageUrl ? (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(194,168,120,0.4),rgba(11,31,58,0.95))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,31,58,0.35),rgba(11,31,58,0.9))]" />
                <span className="absolute left-5 top-5 flex items-center gap-2">
                  {(() => {
                    const bp = dateBadgeParts(featured.startsAt ?? featured.detail)
                    return bp ? <DateBadge month={bp.month} day={bp.day} size="lg" /> : null
                  })()}
                  <span className="rounded bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-navy">
                    Featured
                  </span>
                </span>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
                    {featured.name}
                  </h2>
                  {featured.description && (
                    <p className="mt-2 max-w-2xl text-sm text-white/80">{featured.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/75">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {featured.detail}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {featured.location}
                    </span>
                    <span className="price-pill !bg-white/15 !text-white backdrop-blur-sm">
                      {featured.rating}
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-transform group-hover:scale-[1.03]">
                    Book Experience
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {type === 'events' && rest.length > 0 && (
          <h2 className="mb-5 mt-10 font-serif text-2xl font-bold">Upcoming Experiences</h2>
        )}

        <div
          className={cn(
            'mt-6 grid gap-5',
            type === 'restaurants' && 'sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {rest.map((item) => {
            const isSaved = saved.includes(item.id)
            const detailHref =
              type === 'restaurants' ? `/restaurants/${item.id}` : `/events/${item.id}`
            const parts = eventParts(item)

            if (type === 'events') {
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
                >
                  <Link href={detailHref} className="relative block h-40">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 400px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[linear-gradient(140deg,rgba(194,168,120,0.35),rgba(11,31,58,0.9))]">
                        <span className="font-serif text-4xl font-bold text-gold-soft">
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <DateBadge
                      month={parts.month}
                      day={parts.day}
                      size="sm"
                      className="absolute right-3 top-3 shadow-md"
                    />
                  </Link>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-soft">
                      {item.category}
                    </p>
                    <Link href={detailHref}>
                      <h3 className="mt-1 font-serif text-xl font-bold text-app-fg transition-colors hover:text-gold-soft">
                        {item.name}
                      </h3>
                    </Link>
                    {item.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-app-muted">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-app-border pt-3">
                      <span className="price-pill">{item.rating}</span>
                      <Link
                        href={detailHref}
                        className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-ivory transition-transform active:scale-[0.98]"
                      >
                        Book Tickets
                      </Link>
                    </div>
                  </div>
                </article>
              )
            }

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-soft transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card"
              >
                <div className="relative h-40">
                  <Link href={detailHref} className="block h-full">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 400px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[linear-gradient(140deg,rgba(194,168,120,0.35),rgba(11,31,58,0.9))]">
                        <span className="font-serif text-4xl font-bold text-gold-soft">
                          {item.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setSaved((current) =>
                        isSaved ? current.filter((id) => id !== item.id) : [...current, item.id]
                      )
                    }
                    className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-app-card/90 text-app-fg shadow-sm transition-transform active:scale-90"
                    aria-label={isSaved ? `Unsave ${item.name}` : `Save ${item.name}`}
                  >
                    <Heart className={cn('size-4', isSaved && 'fill-danger text-danger')} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={detailHref}>
                      <h3 className="truncate font-serif text-xl font-bold text-app-fg transition-colors hover:text-gold-soft">
                        {item.name}
                      </h3>
                    </Link>
                    <span className="shrink-0 text-xs font-semibold text-app-muted">
                      ★ {item.rating}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-app-muted">{item.category}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-app-border pt-3 text-xs text-app-muted">
                    <span className="truncate">
                      {item.detail} · {item.location}
                    </span>
                    <Link
                      href={detailHref}
                      className="shrink-0 font-semibold text-app-fg transition-colors hover:text-gold-soft"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {hasMore && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="rounded-md border border-navy px-8 py-3 text-xs font-bold uppercase tracking-[0.14em] text-navy transition-colors hover:bg-navy hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-navy"
            >
              Load More {type === 'restaurants' ? 'Experiences' : 'Events'}
            </button>
          </div>
        )}

        {!visibleItems.length && (
          <div className="mt-8">
            <EmptyState
              icon={<SearchX className="size-6" />}
              title={query ? `No results for “${query}”` : 'Nothing matches these filters'}
              message="Try a different search term or clear some filters."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setActiveFilter('All')
                    setSelected({})
                    setDateRange('All Dates')
                  }}
                  className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-ivory"
                >
                  Reset everything
                </button>
              }
            />
          </div>
        )}
      </div>
    </section>
  )
}
