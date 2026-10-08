'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu as MenuIcon,
  Rocket,
  Settings,
  Sparkles,
  Ticket,
  Utensils,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

/**
 * Shared console shell for partner and admin dashboards.
 *
 * Tokens come from `.shell-console` in `app/globals.css`, so nothing here
 * depends on `data-theme` and nothing leaks into the public site.
 */

export type ConsoleNavItem = {
  label: string
  href: string
}

/**
 * Icons are resolved here rather than passed from the server layouts —
 * a component reference cannot cross the RSC boundary. Keyed by label,
 * so the fallback below is what a renamed nav item gets.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Overview: LayoutDashboard,
  Users: LayoutDashboard,
  Businesses: Building2,
  Organizers: CalendarCheck,
  'Audit Log': BarChart3,
  Metrics: BarChart3,
  Calendar: CalendarDays,
  Events: CalendarDays,
  Reservations: CalendarCheck,
  Tickets: Ticket,
  Analytics: BarChart3,
  Listings: UtensilsCrossed,
  Branches: MapPin,
  Menu: Utensils,
  Settings: Settings,
}

export type ConsoleAccount = {
  organization: string
  role: string
  displayName?: string | null
}

type ConsoleShellProps = {
  navItems: ConsoleNavItem[]
  account: ConsoleAccount
  notificationCount?: number
  /** Rendered as a full-width primary action under the nav. */
  primaryAction?: { label: string; href: string }
  showPromo?: boolean
  /**
   * In-console destinations. Both default to the public marketing/consumer
   * pages, which is wrong for a partner rail — the logo must not dump you
   * out of the console, and Settings must not open the customer account
   * page.
   */
  homeHref?: string
  settingsHref?: string
  children: React.ReactNode
}

function useIsActive(pathname: string) {
  return useCallback(
    (href: string) => {
      if (href.split('/').length <= 3) return pathname === href
      return pathname.startsWith(href)
    },
    [pathname],
  )
}

function initialsFor(account: ConsoleAccount) {
  const source = account.displayName?.trim() || account.organization
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'PW'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Trap focus while open, close on Escape, lock scroll, restore focus on exit. */
function useDrawerBehaviour(
  open: boolean,
  onClose: () => void,
  restoreFocusRef: React.RefObject<HTMLButtonElement | null>,
) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const opener = restoreFocusRef
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    function focusables() {
      return Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = focusables()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    focusables()[0]?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      opener.current?.focus()
    }
  }, [open, onClose, restoreFocusRef])

  return panelRef
}

function useDismissOnOutside(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onClose])
  return ref
}

function ConsoleBrand({ account, homeHref }: { account: ConsoleAccount; homeHref: string }) {
  return (
    <Link
      href={homeHref}
      className="flex items-center gap-2.5 rounded-xl"
      aria-label={`${account.organization} dashboard`}
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-bold tracking-tight text-white">
          {account.organization}
        </span>
        <span className="block truncate text-[11px] font-medium text-console-nav-muted">
          {account.role}
        </span>
      </span>
    </Link>
  )
}

function ConsoleNav({
  navItems,
  account,
  primaryAction,
  showPromo,
  homeHref,
  settingsHref,
  onNavigate,
}: {
  navItems: ConsoleNavItem[]
  account: ConsoleAccount
  primaryAction?: { label: string; href: string }
  showPromo: boolean
  homeHref: string
  /** Anchored target for the "Boost Now" promo. */
  settingsHref: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = useIsActive(pathname)

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-6">
        <ConsoleBrand account={account} homeHref={homeHref} />
      </div>

      <nav aria-label="Dashboard sections" className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = NAV_ICONS[item.label] ?? LayoutDashboard
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200',
                active
                  ? 'bg-console-indigo text-white shadow-[0_6px_18px_rgb(91_63_240/0.4)]'
                  : 'text-console-nav-muted hover:bg-console-nav-soft hover:text-white',
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.4 : 1.9} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {primaryAction && (
        <div className="px-3 pt-4">
          <Link
            href={primaryAction.href}
            onClick={onNavigate}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-console-indigo-deep shadow-[0_8px_20px_rgb(0_0_0/0.28)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
          >
            <Sparkles className="size-4" strokeWidth={2.4} />
            {primaryAction.label}
          </Link>
        </div>
      )}
      {showPromo && (
        <div className="p-3">
          <div className="rounded-2xl bg-gradient-to-br from-console-indigo to-[#7C4DFF] p-4 shadow-[0_10px_28px_rgb(0_0_0/0.3)]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/20">
              <Rocket className="size-[18px] text-white" strokeWidth={2.2} />
            </span>
            <p className="mt-3 text-sm font-bold leading-snug text-white">Boost Your Event</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/75">
              Featured placement in Explore and priority email drops.
            </p>
            <Link
              href={`${settingsHref}#boost`}
              onClick={onNavigate}
              className="mt-3 flex min-h-9 w-full items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-console-indigo-deep transition-colors hover:bg-white/90"
            >
              Boost Now
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ConsoleBell({ count, settingsHref }: { count: number; settingsHref: string }) {
  const [open, setOpen] = useState(false)
  const ref = useDismissOnOutside(open, () => setOpen(false))
  const id = useId()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        className="relative flex size-10 items-center justify-center rounded-xl text-console-muted transition-colors hover:bg-console-bg hover:text-console-ink"
      >
        <Bell className="size-[19px]" strokeWidth={2.1} />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-[#E5484D] px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-console-card">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      <div
        id={id}
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-console-border bg-console-card p-4 shadow-elevate"
      >
        <p className="text-sm font-bold text-console-ink">Notifications</p>
        <p className="mt-1 text-xs text-console-muted">
          {count > 0
            ? `You have ${count} unread update${count === 1 ? '' : 's'}.`
            : 'You are all caught up.'}
        </p>
        <Link
          href={`${settingsHref}#notifications`}
          className="mt-3 block text-xs font-semibold text-console-indigo hover:underline"
        >
          Notification settings
        </Link>
      </div>
    </div>
  )
}

function ConsoleProfile({
  account,
  settingsHref,
}: {
  account: ConsoleAccount
  settingsHref: string
}) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const ref = useDismissOnOutside(open, () => setOpen(false))
  const id = useId()

  // There is no `/auth/signout` route, so sign-out calls Supabase and then
  // hard-navigates, which forces the server components to read the new
  // (empty) session instead of serving a cached one.
  async function signOut() {
    setSigningOut(true)
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/auth/signin')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="menu"
        className="flex min-h-10 items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-console-bg"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-console-indigo to-[#8A6BFF] text-xs font-bold text-white">
          {initialsFor(account)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-semibold leading-tight text-console-ink">
            {account.displayName?.trim() || account.organization}
          </span>
          <span className="block text-[11px] leading-tight text-console-muted">{account.role}</span>
        </span>
        <ChevronDown
          className={cn('size-4 text-console-muted transition-transform', open && 'rotate-180')}
          strokeWidth={2.2}
        />
      </button>

      <div
        id={id}
        hidden={!open}
        role="menu"
        className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-console-border bg-console-card py-1.5 shadow-elevate"
      >
        <div className="border-b border-console-border px-4 pb-3 pt-2">
          <p className="truncate text-[13px] font-semibold text-console-ink">{account.displayName?.trim() || account.organization}</p>
          <p className="truncate text-[11px] text-console-muted">{account.role}</p>
        </div>
        <Link
          href={settingsHref}
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex min-h-10 items-center gap-2.5 px-4 py-2 text-sm text-console-ink transition-colors hover:bg-console-bg"
        >
          <Settings className="size-4 text-console-muted" strokeWidth={2} />
          Settings
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={signOut}
          disabled={signingOut}
          className="flex min-h-10 w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-console-ink transition-colors hover:bg-console-bg disabled:opacity-50"
        >
          <LogOut className="size-4 text-console-muted" strokeWidth={2} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}

export function ConsoleShell({
  navItems,
  account,
  notificationCount = 0,
  primaryAction,
  showPromo = true,
  homeHref = '/dashboard',
  settingsHref = '/dashboard',
  children,
}: ConsoleShellProps) {
  const pathname = usePathname()
  const isActive = useIsActive(pathname)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useDrawerBehaviour(drawerOpen, closeDrawer, menuButtonRef)

  const title =
    navItems.find((item) => isActive(item.href) && item.href !== pathname)?.label ??
    navItems.find((item) => item.href === pathname)?.label ??
    navItems[0]?.label ??
    'Dashboard'

  // A route change should never leave the mobile drawer covering the page.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <div className="shell-console min-h-screen bg-console-bg">
      <a
        href="#console-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-console-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-console-ink focus:shadow-elevate"
      >
        Skip to content
      </a>

      {/* Desktop rail — fixed, always navy, never scrolls away. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] bg-console-nav lg:block">
        <ConsoleNav
          navItems={navItems}
          account={account}
          primaryAction={primaryAction}
          showPromo={showPromo}
          homeHref={homeHref}
          settingsHref={settingsHref}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeDrawer}
            className="absolute inset-0 h-full w-full cursor-default bg-[rgb(10_14_26/0.55)] backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="animate-fade-in-up absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-console-nav shadow-elevate"
          >
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close navigation"
              className="absolute right-3 top-4 flex size-9 items-center justify-center rounded-lg text-console-nav-muted transition-colors hover:bg-console-nav-soft hover:text-white"
            >
              <X className="size-5" strokeWidth={2.2} />
            </button>
            <ConsoleNav
              navItems={navItems}
              account={account}
              primaryAction={primaryAction}
              showPromo={showPromo}
              homeHref={homeHref}
              settingsHref={settingsHref}
              onNavigate={closeDrawer}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 border-b border-console-border bg-console-card/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              className="flex size-10 items-center justify-center rounded-xl text-console-ink transition-colors hover:bg-console-bg lg:hidden"
            >
              <MenuIcon className="size-5" strokeWidth={2.2} />
            </button>

            <p className="min-w-0 flex-1 truncate text-lg font-bold tracking-tight text-console-ink">
              {title}
            </p>

            <ConsoleBell count={notificationCount} settingsHref={settingsHref} />
            <ConsoleProfile account={account} settingsHref={settingsHref} />
          </div>
        </header>

        <main id="console-main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
