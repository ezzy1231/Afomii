'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, CalendarDays, CarFront, Home, MapPinned, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from './SessionProvider'

export default function MobileNavigation() {
  const pathname = usePathname()
  // Client-side session rather than a server prop — keeps pages static.
  const { isAuthenticated } = useSession()
  const items = [
    { href: '/', label: 'Home', icon: Home },
    // "Dining" rather than "Eat": it matches the page's own "Dining guide"
    // eyebrow, and "Eat" read as delivery rather than restaurants. The shorter
    // form is deliberate — six tabs share a 390px bottom bar.
    { href: '/restaurants', label: 'Dining', icon: MapPinned },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/ride', label: 'Ride', icon: CarFront },
    ...(isAuthenticated ? [{ href: '/plans', label: 'My Plans', icon: CalendarCheck }] : []),
  ]
  const accountHref = isAuthenticated ? '/settings' : '/auth/signin'
  const accountActive = pathname.startsWith('/settings') || pathname.startsWith('/auth')
  const all = [...items, { href: accountHref, label: 'Account', icon: UserRound }]

  function isActive(href: string, label: string) {
    if (label === 'Account') return accountActive
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav
      className="chrome-navy fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-app-border px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(0_0_0/0.25)] md:hidden"
      aria-label="Primary"
    >
      {all.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, label)
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[60px] min-w-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200 active:scale-95',
              active ? 'text-ember' : 'text-app-muted'
            )}
          >
            <span aria-hidden className="flex h-7 w-12 items-center justify-center">
              <Icon className={cn('size-[19px]', active ? 'text-ember' : 'text-app-muted')} strokeWidth={active ? 2.4 : 1.9} />
            </span>
            <span className={cn(active && 'font-semibold')}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
