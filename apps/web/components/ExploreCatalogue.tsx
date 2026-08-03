'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock3, Heart, MapPin, Search, SearchX, SlidersHorizontal, Star, Ticket } from 'lucide-react'
import type { CatalogueItem } from '@/lib/catalogue'

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
  const [notice, setNotice] = useState('')
  const visibleItems = items.filter((item) => `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(query.toLowerCase()))
  const icon = type === 'restaurants' ? <Clock3 className="size-4" /> : <CalendarDays className="size-4" />

  function action(item: CatalogueItem) {
    setNotice(type === 'restaurants' ? `Reservation started for ${item.name}.` : `Tickets selected for ${item.name}.`)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-in-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold">Explore</p>
          <h1 className="font-serif text-4xl font-bold text-app-fg sm:text-5xl">{type === 'restaurants' ? 'Good food, nearby.' : 'Something good is happening.'}</h1>
          {source === 'sample' && (
            <p className="mt-2 text-sm text-app-muted">Showing sample listings while live data is being set up.</p>
          )}
        </div>
        <button type="button" className="btn-secondary !py-2 !px-4 text-xs flex items-center gap-2"><SlidersHorizontal className="size-4" />Filters</button>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-input)] p-2 shadow-soft transition-shadow focus-within:shadow-card">
        <Search className="ml-2 size-4 shrink-0 text-app-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-app-muted" placeholder={type === 'restaurants' ? 'Search cuisine, restaurant, or area…' : 'Search events, venues, or interests…'} />
      </div>

      {notice && (
        <p className="animate-pop-in mb-6 flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-medium text-app-fg">
          <CheckCircle2 className="size-4 shrink-0" />
          {notice}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item, i) => {
          const isSaved = saved.includes(item.name)
          const detailHref = type === 'restaurants' ? `/restaurants/${item.id}` : `/events/${item.id}`
          return <article
            key={item.id}
            className="card-elevated animate-fade-in-up overflow-hidden"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Link href={detailHref}>
              <div className={`flex h-36 items-end justify-between bg-gradient-to-br p-5 ${item.color}`}>
                <span className="badge-gold">{item.category}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSaved((current) => isSaved ? current.filter((name) => name !== item.name) : [...current, item.name])
                  }}
                  className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-app-fg shadow-sm backdrop-blur-sm transition-transform active:scale-90"
                  aria-label={`Save ${item.name}`}
                >
                  <Heart className={`size-4 transition-all duration-200 ${isSaved ? 'scale-110 fill-current text-red-500' : ''}`} />
                </button>
              </div>
            </Link>
            <div className="p-5">
              <Link href={detailHref}>
                <h2 className="font-serif text-lg font-bold text-app-fg hover:text-gold transition-colors">{item.name}</h2>
              </Link>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-app-muted"><MapPin className="size-3.5" />{item.location}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-app-muted">
                <span className="flex items-center gap-1.5">{icon}{item.detail}</span>
                <span className="flex items-center gap-1 font-semibold text-app-fg"><Star className="size-4 fill-gold text-gold" />{item.rating}</span>
              </div>
              <button type="button" onClick={() => action(item)} className="btn-primary mt-5 w-full !py-2.5 text-sm">{type === 'restaurants' ? 'Reserve a table' : <span className="flex items-center justify-center gap-2"><Ticket className="size-4" />Get tickets</span>}</button>
            </div>
          </article>
        })}
      </div>

      {!visibleItems.length && (
        <div className="animate-fade-in-up flex flex-col items-center py-20 text-center text-app-muted">
          <SearchX className="mb-4 size-10" />
          <p className="text-lg">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-sm mt-1">Try a different search term.</p>
        </div>
      )}
    </section>
  )
}
