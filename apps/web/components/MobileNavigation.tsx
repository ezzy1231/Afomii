'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, CalendarDays, CarFront, Home, MapPinned, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MobileNavigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()
  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/restaurants', label: 'Eat', icon: MapPinned },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/ride', label: 'Ride', icon: CarFront },
    ...(isAuthenticated ? [{ href: '/plans', label: 'Plans', icon: CalendarCheck }] : []),
  ]
  const accountHref = isAuthenticated ? '/settings' : '/auth/signin'
  const accountActive = pathname.startsWith('/settings') || pathname.startsWith('/auth')

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-around rounded-[22px] border border-white/50 bg-white/60 px-1.5 py-1.5 shadow-glass backdrop-blur-2xl backdrop-saturate-150 md:hidden dark:border-white/10 dark:bg-white/8"
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
              'flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[10px] transition-all duration-200 active:scale-90',
              active
                ? 'bg-gradient-to-br from-[#F0A848] to-[#D28A37] text-[#080C17] shadow-[0_2px_8px_rgb(240_168_72/0.35)]'
                : 'text-app-muted'
            )}
          >
            <Icon
              className={cn('size-[18px]', active ? 'text-white' : 'text-app-muted')}
              strokeWidth={active ? 2.4 : 2}
            />
            <span className={cn(active ? 'font-semibold text-white' : 'text-app-muted')}>
              {label}
            </span>
          </Link>
        )
      })}
      <Link
        href={accountHref}
        aria-current={accountActive ? 'page' : undefined}
        className={cn(
          'flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[10px] transition-all duration-200 active:scale-90',
          accountActive
            ? 'bg-gradient-to-br from-[#F0A848] to-[#D28A37] text-[#080C17] shadow-[0_2px_8px_rgb(240_168_72/0.35)]'
            : 'text-app-muted'
        )}
      >
        <UserRound
          className={cn('size-[18px]', accountActive ? 'text-white' : 'text-app-muted')}
          strokeWidth={accountActive ? 2.4 : 2}
        />
        <span className={cn(accountActive ? 'font-semibold text-white' : 'text-app-muted')}>
          Account
        </span>
      </Link>
    </nav>
  )
}
