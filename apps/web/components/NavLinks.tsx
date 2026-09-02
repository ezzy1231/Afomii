'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function NavLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/restaurants', label: 'Restaurants' },
    { href: '/events', label: 'Events' },
    { href: '/ride', label: 'Ride' },
    ...(isAuthenticated ? [{ href: '/plans', label: 'My Plans' }] : []),
  ]

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      {links.map(({ href, label }) => {
        const active =
          href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 active:translate-y-px',
              active
                ? 'bg-ember/12 text-ember'
                : 'text-app-muted hover:bg-app-elevated/60 hover:text-app-fg'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
