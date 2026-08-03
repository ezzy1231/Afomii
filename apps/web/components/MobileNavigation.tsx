'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, CarFront, Home, MapPinned, UserRound } from 'lucide-react'

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/restaurants', label: 'Eat', icon: MapPinned },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/ride', label: 'Ride', icon: CarFront },
]

export default function MobileNavigation({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname()
  const accountHref = isAuthenticated ? '/settings' : '/auth/signin'

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md items-center justify-around rounded-2xl border border-[var(--border)] bg-[var(--nav-bg)] px-2 py-1.5 nav-blur shadow-soft md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-medium transition-all active:scale-90"
          >
            <span className={`flex size-7 items-center justify-center rounded-lg transition-colors ${active ? 'text-gold' : 'text-app-muted'}`}>
              <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 1.8} />
            </span>
            <span className={active ? 'text-gold font-semibold' : 'text-app-muted'}>{label}</span>
          </Link>
        )
      })}
      <Link
        href={accountHref}
        className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-medium transition-all active:scale-90"
      >
        <span className={`flex size-7 items-center justify-center rounded-lg transition-colors ${pathname.startsWith('/settings') || pathname.startsWith('/auth') ? 'text-gold' : 'text-app-muted'}`}>
          <UserRound className="size-[18px]" />
        </span>
        <span className={pathname.startsWith('/settings') || pathname.startsWith('/auth') ? 'text-gold font-semibold' : 'text-app-muted'}>Account</span>
      </Link>
    </nav>
  )
}
