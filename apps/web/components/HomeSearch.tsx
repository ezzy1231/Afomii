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
    <form
      onSubmit={submit}
      className="glass flex items-center gap-2 rounded-2xl p-2"
    >
      <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-3">
        <Search className="size-[18px] shrink-0 text-app-muted" strokeWidth={2.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants or cuisines"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-app-fg outline-none placeholder:text-app-muted"
          aria-label="Search restaurants"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-ember to-ember-deep px-4 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgb(var(--ember-rgb)/0.4)] active:translate-y-0 active:scale-[0.98] sm:px-5"
      >
        Explore
        <ArrowUpRight className="size-4" strokeWidth={2.5} />
      </button>
    </form>
  )
}
