'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Search } from 'lucide-react'

export default function HomeSearch({ variant = 'default' }: { variant?: 'default' | 'onDark' }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/restaurants?q=${encodeURIComponent(q)}` : '/restaurants')
  }

  const onDark = variant === 'onDark'

  return (
    <form
      onSubmit={submit}
      className={
        onDark
          ? 'flex items-center gap-2 rounded-2xl border border-white/15 bg-[rgb(240_236_228/0.07)] p-2 shadow-glass backdrop-blur-xl backdrop-saturate-150'
          : 'glass flex items-center gap-2 rounded-2xl p-2'
      }
    >
      <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-3">
        <Search
          className={onDark ? 'size-[18px] shrink-0 text-[#848A9E]' : 'size-[18px] shrink-0 text-app-muted'}
          strokeWidth={2.5}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants or cuisines"
          className={
            onDark
              ? 'min-w-0 flex-1 bg-transparent text-sm font-medium text-[#F0ECE4] outline-none placeholder:text-[#848A9E]'
              : 'min-w-0 flex-1 bg-transparent text-sm font-medium text-app-fg outline-none placeholder:text-app-muted'
          }
          aria-label="Search restaurants"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#F0A848] to-[#D28A37] px-4 text-sm font-semibold text-[#080C17] shadow-[0_2px_12px_rgb(240_168_72/0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgb(240_168_72/0.45)] active:translate-y-0 active:scale-[0.98] sm:px-5"
      >
        Explore
        <ArrowUpRight className="size-4" strokeWidth={2.5} />
      </button>
    </form>
  )
}
