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
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-around rounded-2xl border border-app-border bg-app-card/95 px-1.5 py-1.5 nav-blur shadow-[0_16px_40px_rgba(2,12,28,0.22)] md:hidden"
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
              'flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-all active:scale-90',
              active && 'bg-navy text-ivory shadow-sm'
            )}
          >
            <Icon
              className={cn('size-[18px]', active ? 'text-gold' : 'text-app-muted')}
              strokeWidth={active ? 2.4 : 1.8}
            />
            <span className={cn(active ? 'font-semibold text-ivory' : 'text-app-muted')}>
              {label}
            </span>
          </Link>
        )
      })}
      <Link
        href={accountHref}
        aria-current={accountActive ? 'page' : undefined}
        className={cn(
          'flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-all active:scale-90',
          accountActive && 'bg-navy text-ivory shadow-sm'
        )}
      >
        <UserRound
          className={cn('size-[18px]', accountActive ? 'text-gold' : 'text-app-muted')}
          strokeWidth={accountActive ? 2.4 : 1.8}
        />
        <span className={cn(accountActive ? 'font-semibold text-ivory' : 'text-app-muted')}>
          Account
        </span>
      </Link>
    </nav>
  )
}
