'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search } from 'lucide-react'

export default function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    setPending(true)
    router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : '/restaurants')
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="group flex min-w-0 items-center gap-2 rounded-2xl border border-app-border bg-app-card p-1.5 shadow-card transition-[box-shadow,border-color] duration-200 focus-within:border-ember focus-within:ring-2 focus-within:ring-ember/15"
    >
      <label className="flex min-h-12 min-w-0 flex-1 cursor-text items-center gap-3 px-3">
        <Search className="size-[18px] shrink-0 text-app-muted transition-colors group-focus-within:text-ember" strokeWidth={2.4} aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Restaurant, cuisine or area"
          className="min-h-0 w-full min-w-0 flex-1 bg-transparent text-base font-medium text-app-fg outline-none placeholder:text-app-subtle"
          aria-label="Search restaurants"
          enterKeyHint="search"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-primary min-h-12 shrink-0 !rounded-xl !px-4 sm:!px-6">
        Explore
        <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
      </button>
    </form>
  )
}
