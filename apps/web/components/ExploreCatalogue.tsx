'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock3, Heart, MapPin, Search, SearchX, SlidersHorizontal, Sparkles, Star, Ticket } from 'lucide-react'
import type { CatalogueItem } from '@/lib/catalogue'

const filterChips = {
  restaurants: ['All', 'Italian', 'Bar', 'Café', 'Seafood', 'Brunch'],
  events: ['All', 'Music', 'Sports', 'Food & Drink', 'More'],
} as const

export default function ExploreCatalogue({
  type,
  items,
  source,
}: {
  type: 'restaurants' | 'events'
  items: CatalogueItem[]
  source: 'live' | 'sample'
}) {
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [notice, setNotice] = useState('')

  const visibleItems = items.filter((item) => {
    const text = `${item.name} ${item.category} ${item.location}`.toLowerCase()
    const queryMatch = text.includes(query.toLowerCase())
    const filterMatch = activeFilter === 'All' || item.category.toLowerCase().includes(activeFilter.toLowerCase()) || item.name.toLowerCase().includes(activeFilter.toLowerCase())
    return queryMatch && filterMatch
  })

  const icon = type === 'restaurants' ? <Clock3 className="size-4" /> : <CalendarDays className="size-4" />

  function action(item: CatalogueItem) {
    setNotice(type === 'restaurants' ? `Reservation started for ${item.name}.` : `Tickets selected for ${item.name}.`)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[28px] border border-[#d7b778]/30 bg-[#071a2e] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d7b778]">{type === 'restaurants' ? 'Discover' : 'Explore events'}</p>
            <h1 className="font-serif text-3xl font-bold text-[#f7f0e4] sm:text-5xl">
              {type === 'restaurants' ? 'Good food, nearby.' : 'Something good is happening.'}
            </h1>
          </div>
          <button type="button" className="inline-flex items-center gap-2 self-start rounded-full border border-[#d7b778]/30 bg-[#d7b778]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f3dfaf]">
            <SlidersHorizontal className="size-4" />
            Filters
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#d7b778]/20 bg-[#0d1d2f] px-3 py-3">
          <Search className="ml-1 size-4 shrink-0 text-[#d7b778]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#f5efe9] outline-none placeholder:text-[#b9b0a1]"
            placeholder={type === 'restaurants' ? 'Search cuisines, restaurants, or areas…' : 'Search events, venues, or interests…'}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterChips[type].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveFilter(chip)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                activeFilter === chip
                  ? 'bg-[#d7b778] text-[#06182d] font-semibold'
                  : 'border border-[#d7b778]/25 bg-[#0d1d2f] text-[#e4dccf]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="animate-pop-in mb-6 flex items-center gap-2 rounded-xl border border-[#d7b778]/25 bg-[#d7b778]/10 px-4 py-3 text-sm font-medium text-[#f7f0e3]">
          <CheckCircle2 className="size-4 shrink-0 text-[#d7b778]" />
          {notice}
        </p>
      )}

      {source === 'sample' && (
        <p className="mb-6 text-sm text-[#d3cabf]">Showing sample listings while live data is being set up.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item, i) => {
          const isSaved = saved.includes(item.name)
          const detailHref = type === 'restaurants' ? `/restaurants/${item.id}` : `/events/${item.id}`
          const primaryBg = i % 2 === 0
            ? 'bg-[radial-gradient(circle_at_top,_rgba(215,183,120,0.35),transparent_30%),linear-gradient(135deg,#1c0c17_0%,#0d1a2d_55%,#0a1528_100%)]'
            : 'bg-[radial-gradient(circle_at_bottom,_rgba(215,183,120,0.28),transparent_30%),linear-gradient(135deg,#0d1d2f_0%,#162a43_45%,#101a2c_100%)]'

          return (
            <article
              key={item.id}
              className="animate-fade-in-up overflow-hidden rounded-[24px] border border-[#d7b778]/20 bg-[#091b2e] shadow-[0_20px_50px_rgba(0,0,0,.24)]"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Link href={detailHref}>
                <div className={`${primaryBg} relative flex h-52 items-end justify-between p-5`}>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,25,43,0.1),rgba(7,25,43,0.82))]" />
                  <div className="relative z-10 flex items-center gap-2 rounded-full border border-[#d7b778]/35 bg-[#0d1d2f]/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f2d793]">
                    {item.category}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSaved((current) => isSaved ? current.filter((name) => name !== item.name) : [...current, item.name])
                    }}
                    className="relative z-10 flex size-10 items-center justify-center rounded-full border border-[#d7b778]/30 bg-[#0d1d2f]/75 text-[#f7f0e7] backdrop-blur-sm transition-transform active:scale-90"
                    aria-label={`Save ${item.name}`}
                  >
                    <Heart className={`size-4 transition-all duration-200 ${isSaved ? 'fill-current text-[#f6c3c3]' : ''}`} />
                  </button>
                </div>
              </Link>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Link href={detailHref} className="font-serif text-2xl font-bold text-[#f7f0e7] hover:text-[#d7b778] transition-colors">
                    {item.name}
                  </Link>
                  <div className="flex items-center gap-1 rounded-full border border-[#d7b778]/20 bg-[#d7b778]/10 px-2 py-1 text-xs font-semibold text-[#f1d79b]">
                    <Star className="size-3.5 fill-current" />
                    {item.rating}
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm text-[#d7d0c5]">
                  <MapPin className="size-4 text-[#d7b778]" />
                  {item.location}
                </div>

                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#d7b778]/15 bg-[#0d1d2f] px-3 py-2 text-sm text-[#d8d0c7]">
                  <span className="flex items-center gap-2">{icon}{item.detail}</span>
                  <span className="text-[#d7b778]">{type === 'restaurants' ? 'Open now' : 'Tickets'}</span>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => action(item)} className="flex-1 rounded-xl bg-[#d7b778] px-4 py-2.5 text-sm font-semibold text-[#06182d]">
                    {type === 'restaurants' ? 'Reserve' : 'Book now'}
                  </button>
                  <Link href={detailHref} className="flex items-center justify-center rounded-xl border border-[#d7b778]/25 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#f5efe9]">
                    View
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {!visibleItems.length && (
        <div className="animate-fade-in-up flex flex-col items-center py-20 text-center text-[#d0c7bb]">
          <SearchX className="mb-4 size-10 text-[#d7b778]" />
          <p className="text-lg">No results for &ldquo;{query}&rdquo;</p>
          <p className="mt-1 text-sm">Try a different search term or filter.</p>
        </div>
      )}
    </section>
  )
}
