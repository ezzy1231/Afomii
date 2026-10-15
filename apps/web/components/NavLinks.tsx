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
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
      {links.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-11 items-center px-3 text-sm font-medium transition-colors duration-200',
              active ? 'text-app-fg' : 'text-app-muted hover:text-app-fg'
            )}
          >
            {label}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-3 bottom-1.5 h-[2px] origin-left rounded-full bg-ember transition-transform duration-300 ease-out',
                active ? 'scale-x-100' : 'scale-x-0'
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}
