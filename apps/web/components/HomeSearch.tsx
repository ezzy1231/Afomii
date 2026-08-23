'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'food', label: 'Food', href: '/restaurants', placeholder: 'Search restaurants, cuisines...' },
  { key: 'events', label: 'Events', href: '/events', placeholder: 'Search events, concerts...' },
  { key: 'rides', label: 'Rides', href: '/ride', placeholder: 'Where to?' },
] as const

export default function HomeSearch() {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('food')
  const [query, setQuery] = useState('')

  const active = TABS.find((t) => t.key === tab)!

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q && tab !== 'rides' ? `${active.href}?q=${encodeURIComponent(q)}` : active.href)
  }

  return (
    <div className="rounded-lg bg-app-card p-2 shadow-[var(--shadow-lg)] sm:p-3">
      <div className="mb-2 grid grid-cols-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'relative py-2.5 text-sm font-semibold transition-colors',
              tab === t.key ? 'text-app-fg' : 'text-app-muted hover:text-app-fg'
            )}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-navy dark:bg-gold" />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md border border-app-border bg-app-bg px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-app-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={active.placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-app-fg outline-none placeholder:text-app-muted"
            aria-label="Search"
          />
        </div>
        <div className="hidden items-center gap-2 rounded-md border border-app-border bg-app-bg px-3.5 py-2.5 lg:flex">
          <MapPin className="size-4 shrink-0 text-app-muted" />
          <span className="text-sm text-app-fg">Addis Ababa</span>
        </div>
        <button
          type="submit"
          className="rounded-md bg-navy px-7 py-2.5 text-sm font-semibold text-ivory transition-transform active:scale-[0.98]"
        >
          Search
        </button>
      </form>
    </div>
  )
}
