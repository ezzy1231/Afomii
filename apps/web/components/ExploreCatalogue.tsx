'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { StaggerGroup, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'
import { loadSavedIds, persistSavedIds } from '@/lib/saved'

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
  const [saved, setSaved] = useState<string[]>(loadSavedIds)
  const [activeFilter, setActiveFilter] = useState('All')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [dateRange, setDateRange] = useState<(typeof dateChips)[number]>('All Dates')
  const [sortDesc, setSortDesc] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)

  // Persist bookmarks so saved places survive navigation/refresh.
  useEffect(() => {
    persistSavedIds(saved)
  }, [saved])

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
          <p className="eyebrow">Dining guide</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-app-fg sm:text-6xl">
              Find a table worth remembering.
            </h1>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="glass-subtle inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
              aria-expanded={searchOpen}
            >
              <Search className="size-4 text-ember" strokeWidth={2.5} />
              Search restaurants
            </button>
          </div>
          <p className="mt-3 max-w-xl text-base leading-7 text-app-muted">
            Discover trusted places for every kind of gathering, from quick lunches to special evenings.
          </p>
          {searchOpen && (
            <div className="glass animate-pop-in mt-5 flex max-w-xl items-center gap-3 rounded-2xl px-3">
              <Search className="size-[18px] shrink-0 text-app-muted" strokeWidth={2.5} />
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
          <p className="eyebrow">What’s on</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-app-fg sm:text-6xl">
              Your next great night out.
            </h1>
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="glass-subtle inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0 active:scale-[0.98]"
              aria-expanded={searchOpen}
            >
              <Search className="size-4 text-ember" strokeWidth={2.5} />
              Search
            </button>
          </div>
          <p className="mt-3 max-w-xl text-base leading-7 text-app-muted">
            Discover and book premium experiences, from intimate jazz nights to grand
            galas. Arrive in style with UrbanExplore.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {searchOpen && (
              <div className="glass animate-pop-in flex min-h-11 min-w-[min(100%,22rem)] flex-1 items-center gap-2.5 rounded-2xl px-3">
              <Search className="size-[18px] shrink-0 text-app-muted" strokeWidth={2.5} />
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
                    'min-h-10 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.97]',
                    dateRange === chip
                      ? 'border-transparent bg-gradient-to-br from-[#F0A848] to-[#D28A37] text-[#080C17] shadow-[0_2px_8px_rgb(240 168 72 / 0.3)]'
                      : 'border-app-border bg-app-card/70 text-app-muted hover:border-ember/25 hover:text-app-fg'
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
              className="glass-subtle inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-app-muted transition-all duration-200 hover:-translate-y-0.5 hover:text-app-fg active:translate-y-0 active:scale-[0.98]"
            >
              {sortDesc ? 'Rating ↓' : 'Rating ↑'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98]',
              filtersOpen || activeCount
                ? 'border-transparent bg-gradient-to-br from-[#F0A848] to-[#D28A37] text-[#080C17] shadow-[0_2px_8px_rgb(240 168 72 / 0.3)]'
                : 'glass-subtle border-app-border text-app-muted hover:-translate-y-0.5 hover:text-app-fg'
            )}
            aria-label="Filters"
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-ember">
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
          <p className="sticker sticker-cream mt-5 !rotate-0">
            Showing sample listings while live data is being set up.
          </p>
        )}

        {/* Featured card */}
        {featured && (
          <div className="mt-6">
            {type === 'restaurants' ? (
              <Link
                href={`/restaurants/${featured.id}`}
                className="group relative block min-h-[300px] overflow-hidden rounded-3xl shadow-glass transition-shadow duration-300 hover:shadow-glass-strong"
              >
                {featured.imageUrl ? (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ember/50 to-ember-deep/95" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.05)_25%,rgba(10,10,12,0.85))]" />
                <span className="sticker sticker-amber absolute left-5 top-5 !rotate-0">
                  Featured
                </span>
                <span className="absolute right-5 top-5 flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold text-app-fg shadow-soft backdrop-blur-md dark:bg-white/15 dark:text-white">
                  <Star className="size-3 fill-ember text-ember" />
                  {featured.rating}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">{featured.name}</h2>
                    <p className="mt-1 text-sm font-medium text-white/75">
                      {featured.category} · {featured.detail} · {featured.location}
                    </p>
                  </div>
                  <span className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-[#080C17] shadow-[0_2px_12px_rgb(240 168 72 / 0.3)] transition-transform duration-200 hover:-translate-y-0.5 group-hover:scale-[1.03]">
                    Reserve Table
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                href={`/events/${featured.id}`}
                className="group relative block min-h-[300px] overflow-hidden rounded-3xl shadow-glass transition-shadow duration-300 hover:shadow-glass-strong"
              >
                {featured.imageUrl ? (
                  <Image
                    src={featured.imageUrl}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ember/50 to-ember-deep/95" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.3),rgba(10,10,12,0.9))]" />
                <span className="absolute left-5 top-5 flex items-center gap-2">
                  {(() => {
                    const bp = dateBadgeParts(featured.startsAt ?? featured.detail)
                    return bp ? <DateBadge month={bp.month} day={bp.day} size="lg" /> : null
                  })()}
                  <span className="sticker sticker-amber !rotate-0">
                    Featured
                  </span>
                </span>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h2 className="text-3xl font-bold text-white sm:text-4xl">
                    {featured.name}
                  </h2>
                  {featured.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{featured.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-white/75">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {featured.detail}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {featured.location}
                    </span>
                    <span className="price-pill">
                      {featured.rating}
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-[#080C17] shadow-[0_2px_12px_rgb(240 168 72 / 0.3)] transition-transform duration-200 group-hover:scale-[1.03]">
                    Book Experience
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {type === 'events' && rest.length > 0 && (
          <h2 className="mb-5 mt-10 text-2xl font-bold text-app-fg">Upcoming Experiences</h2>
        )}

        <StaggerGroup
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
                <StaggerItem key={item.id} className="h-full">
                  <article className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-3xl">
                    <Link href={detailHref} className="relative block h-40">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-ember/50 to-ember-deep/90">
                          <span className="text-4xl font-bold text-white">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <DateBadge
                        month={parts.month}
                        day={parts.day}
                        size="sm"
                        className="absolute right-3 top-3"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ember">
                        {item.category}
                      </p>
                      <Link href={detailHref}>
                        <h3 className="mt-1 text-xl font-semibold text-app-fg transition-colors hover:text-ember">
                          {item.name}
                        </h3>
                      </Link>
                      {item.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-app-muted">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-app-border pt-3">
                        <span className="price-pill">{item.rating}</span>
                        <Link
                          href={detailHref}
                          className="rounded-xl bg-ember px-4 py-2 text-xs font-semibold text-[#080C17] shadow-[0_2px_8px_rgb(240 168 72 / 0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgb(240 168 72 / 0.3)] active:translate-y-0"
                        >
                          Book Tickets
                        </Link>
                      </div>
                    </div>
                  </article>
                </StaggerItem>
              )
            }

            return (
              <StaggerItem key={item.id} className="h-full">
                <article className="glass glass-hover group flex h-full flex-col overflow-hidden rounded-3xl">
                  <div className="relative h-40">
                    <Link href={detailHref} className="block h-full">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-ember/50 to-ember-deep/90">
                          <span className="text-4xl font-bold text-white">
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
                      className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/70 text-app-fg shadow-soft backdrop-blur-md transition-transform hover:scale-105 active:scale-90 dark:bg-white/15"
                      aria-label={isSaved ? `Unsave ${item.name}` : `Save ${item.name}`}
                    >
                      <Heart className={cn('size-4', isSaved && 'fill-danger text-danger')} />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={detailHref}>
                        <h3 className="truncate text-xl font-semibold text-app-fg transition-colors hover:text-ember">
                          {item.name}
                        </h3>
                      </Link>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ember/10 px-2 py-0.5 text-xs font-semibold text-ember">
                        <Star className="size-3 fill-current" />
                        {item.rating}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-app-muted">{item.category}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-app-border pt-3 text-xs text-app-muted">
                      <span className="truncate">
                        {item.detail} · {item.location}
                      </span>
                      <Link
                        href={detailHref}
                        className="shrink-0 font-semibold text-ember transition-colors hover:text-ember-deep"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            )
          })}
        </StaggerGroup>

        {hasMore && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="glass glass-hover rounded-2xl px-8 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-app-fg"
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
                  className="btn-primary !px-5 !py-2.5"
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
