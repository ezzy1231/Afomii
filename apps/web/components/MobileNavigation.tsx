'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, CarFront, Home, MapPinned, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/restaurants', label: 'Eat', icon: MapPinned },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/ride', label: 'Ride', icon: CarFront },
]

export default function MobileNavigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()
  const accountHref = isAuthenticated ? '/settings' : '/auth/signin'
  const accountActive = pathname.startsWith('/settings') || pathname.startsWith('/auth')

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-around rounded-3xl border border-app-border bg-app-panel/95 px-2 py-1.5 nav-blur shadow-[var(--shadow-lg)] md:hidden"
      aria-label="Primary"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-medium transition-all active:scale-90',
              active && 'bg-gold/10'
            )}
          >
            <Icon
              className={cn('size-[18px]', active ? 'text-gold-soft' : 'text-app-muted')}
              strokeWidth={active ? 2.4 : 1.8}
            />
            <span className={cn(active ? 'font-semibold text-gold-soft' : 'text-app-muted')}>
              {label}
            </span>
          </Link>
        )
      })}
      <Link
        href={accountHref}
        aria-current={accountActive ? 'page' : undefined}
        className={cn(
          'flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-medium transition-all active:scale-90',
          accountActive && 'bg-gold/10'
        )}
      >
        <UserRound
          className={cn('size-[18px]', accountActive ? 'text-gold-soft' : 'text-app-muted')}
          strokeWidth={accountActive ? 2.4 : 1.8}
        />
        <span className={cn(accountActive ? 'font-semibold text-gold-soft' : 'text-app-muted')}>
          Account
        </span>
      </Link>
    </nav>
  )
}
