'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Search } from 'lucide-react'

export default function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : '/restaurants')
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-white/15 bg-app-card/95 p-2 shadow-[0_20px_55px_rgba(1,12,28,0.3)] backdrop-blur-xl">
        <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-3">
          <Search className="size-[18px] shrink-0 text-gold-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants or cuisines"
            className="min-w-0 flex-1 bg-transparent text-sm text-app-fg outline-none placeholder:text-app-muted"
            aria-label="Search restaurants"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-bold text-navy transition-all hover:brightness-105 active:scale-[0.98] sm:px-5"
        >
          Explore
          <ArrowUpRight className="size-4" />
        </button>
    </form>
  )
}
