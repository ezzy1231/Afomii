import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import Link from 'next/link'
import MobileNavigation from './MobileNavigation'
import NavLinks from './NavLinks'
import NotificationsBell from './NotificationsBell'
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
  const [unreadCount] = await Promise.all([
    user ? getUnreadNotificationCount(user.id) : Promise.resolve(0),
  ])
  const initial =
    (user?.user_metadata?.full_name as string)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    null

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-app-border nav-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform active:scale-[0.98]"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0A848] to-[#D28A37] text-sm font-bold text-[#080C17] shadow-[0_2px_8px_rgb(240_168_72/0.35)] transition-transform group-hover:scale-105">
              U
            </span>
            <span className="text-lg font-bold tracking-tight text-app-fg">
              UrbanExplore
            </span>
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
            <NavLinks isAuthenticated={Boolean(user)} />
          </div>

          <div className="flex items-center gap-1">
            {user ? <NotificationsBell initialCount={unreadCount} /> : null}
            <span>
              <ThemeToggle />
            </span>
            {user ? (
              <Link
                href="/settings"
                className="ml-1 flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0A848] to-[#D28A37] text-sm font-bold text-[#080C17] shadow-[0_2px_8px_rgb(240_168_72/0.3)] transition-transform hover:scale-105 active:scale-95"
                aria-label="Your account"
              >
                {initial ?? 'U'}
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="btn-primary ml-1 !rounded-xl !px-4 !py-2 text-sm"
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
