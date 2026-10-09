'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Sub-navigation for one listing's management screens. Tabs are links, not
 * state, so a listing's branches and menu are each linkable and the back
 * button returns to the same tab.
 */
export function ListingTabs({
  listingId,
  listingName,
}: {
  listingId: string
  listingName: string
}) {
  const pathname = usePathname()
  const root = `/dashboard/restaurant/listings/${listingId}`

  const tabs = [
    { label: 'Details', href: root },
    { label: 'Branches', href: `${root}/branches` },
    { label: 'Menu', href: `${root}/menu` },
  ]

  return (
    <div className="space-y-3">
      <Link
        href="/dashboard/restaurant/listings"
        className="inline-block text-xs font-semibold uppercase tracking-widest text-app-muted transition-colors hover:text-ember"
      >
        ← All listings
      </Link>
      <div>
        <h1 className="truncate text-2xl font-bold tracking-tight">{listingName}</h1>
        <p className="mt-1 text-sm text-app-muted">
          Branches and menu belong to this listing only.
        </p>
      </div>
      <nav
        aria-label={`${listingName} sections`}
        className="flex flex-wrap gap-2 border-b border-app-border"
      >
        {tabs.map((tab) => {
          const active =
            tab.href === root ? pathname === root : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                '-mb-px min-h-11 whitespace-nowrap border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors',
                active
                  ? 'border-ember/40 text-ember'
                  : 'border-transparent text-app-muted hover:text-app-fg',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}