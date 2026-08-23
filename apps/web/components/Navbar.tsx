import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import MobileNavigation from './MobileNavigation'
import NavLinks from './NavLinks'
import ThemeToggle from './ThemeToggle'

async function getUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export default async function Navbar() {
  const user = await getUser()
  const initial =
    (user?.user_metadata?.full_name as string)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    null

  return (
    <>
      <header className="sticky top-0 z-50 bg-navy text-ivory shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight transition-opacity hover:opacity-85"
          >
            UrbanExplore
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <NavLinks />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Notifications"
              className="flex size-9 items-center justify-center rounded-full text-ivory/70 transition-colors hover:bg-white/10 hover:text-ivory"
            >
              <Bell className="size-4" />
            </button>
            <span className="text-ivory/30">
              <ThemeToggle />
            </span>
            {user ? (
              <Link
                href="/settings"
                className="ml-1 flex size-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy transition-transform hover:scale-105"
                aria-label="Your account"
              >
                {initial ?? 'U'}
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="ml-1 rounded-md bg-gold px-4 py-1.5 text-sm font-semibold text-navy transition-transform active:scale-[0.98]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <MobileNavigation isAuthenticated={Boolean(user)} />
    </>
  )
}
