import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Compass, MapPinned, CalendarDays, CarFront, Settings } from 'lucide-react'
import MobileNavigation from './MobileNavigation'
import ThemeToggle from './ThemeToggle'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default async function Navbar() {
  const user = await getUser()

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl rounded-2xl bg-[var(--nav-bg)] border border-[var(--border)] shadow-soft nav-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold text-app-fg transition-opacity hover:opacity-80 active:scale-95">
            <span className="flex size-8 items-center justify-center rounded-lg bg-navy text-ivory shadow-sm">
              <Compass className="size-4" />
            </span>
            UrbanExplore
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/restaurants" className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-app-muted transition-colors hover:bg-[var(--bg-hover)] hover:text-app-fg">
              <MapPinned className="size-4" />
              Restaurants
            </Link>
            <Link href="/events" className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-app-muted transition-colors hover:bg-[var(--bg-hover)] hover:text-app-fg">
              <CalendarDays className="size-4" />
              Events
            </Link>
            <Link href="/ride" className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-app-muted transition-colors hover:bg-[var(--bg-hover)] hover:text-app-fg">
              <CarFront className="size-4" />
              Ride
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-app-muted transition-colors hover:bg-[var(--bg-hover)] hover:text-app-fg"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-navy text-ivory text-xs font-bold shadow-sm">
                  {(user.user_metadata?.full_name as string)?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                </span>
                <span className="hidden sm:inline text-xs">
                  {(user.user_metadata?.full_name as string)?.split(' ')[0] ?? 'Account'}
                </span>
                <Settings className="hidden size-3.5 sm:block" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="hidden text-sm font-medium text-app-muted transition-colors hover:text-app-fg sm:block"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/role"
                  className="btn-primary !py-1.5 !px-4 text-xs"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-16" />
      <MobileNavigation isAuthenticated={Boolean(user)} />
    </>
  )
}
