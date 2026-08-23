'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/events', label: 'Events' },
  { href: '/ride', label: 'Ride' },
  { href: '/settings', label: 'Profile' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
      {links.map(({ href, label }) => {
        const active =
          href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative py-1 text-sm font-medium transition-colors',
              active
                ? 'text-ivory after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-gold'
                : 'text-ivory/60 hover:text-ivory'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
