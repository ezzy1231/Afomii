"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  History,
  LayoutDashboard,
  LineChart,
  MapPin,
  Megaphone,
  Settings,
  Store,
  Ticket,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import NotificationsBell from "../NotificationsBell";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type SidebarProps = {
  title: string;
  navItems: NavItem[];
  notificationCount?: number;
};

const navIcons: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Dashboard: LayoutDashboard,
  Reservations: CalendarRange,
  Branches: MapPin,
  Menu: Store,
  Listings: UtensilsCrossed,
  Analytics: BarChart3,
  Events: CalendarDays,
  Calendar: CalendarDays,
  Tickets: Ticket,
  Users,
  Businesses: Store,
  Organizers: Megaphone,
  "Audit Log": History,
  Metrics: LineChart,
  Settings,
};

export function Sidebar({ title, navItems, notificationCount }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard/restaurant" || href === "/dashboard/organizer" || href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar — glass panel floating over the ambient glow */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-app-border bg-white/45 text-app-fg backdrop-blur-2xl backdrop-saturate-150 dark:bg-white/[0.04] lg:flex">
        <div className="border-b border-app-border p-7">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-ember-deep text-sm font-bold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.35)]">
                U
              </span>
              <span className="text-lg font-bold tracking-tight text-app-fg">
                UrbanExplore
              </span>
              <span className="text-[10px] uppercase tracking-widest text-app-muted">
                Partner
              </span>
            </Link>
            <NotificationsBell initialCount={notificationCount ?? 0} />
          </div>
        </div>

        <div className="px-6 pb-2 pt-7">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-app-muted">
            {title}
          </h2>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = navIcons[item.label] ?? BarChart3;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-ember/12 text-ember shadow-[inset_0_0_0_1px_rgb(var(--ember-rgb)/0.15)]"
                    : "text-app-muted hover:bg-app-elevated/60 hover:text-app-fg"
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.3 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-app-border p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 text-sm text-app-muted transition-colors hover:text-app-fg"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-ember/15 text-xs font-bold text-ember">
              P
            </span>
            <span>
              <span className="block font-medium text-app-fg">Partner account</span>
              <span className="block text-xs">Settings & sign out</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile tab strip */}
      <nav
        className="nav-blur sticky top-0 z-30 overflow-x-auto border-b border-app-border text-app-fg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
        aria-label="Dashboard"
      >
        <div className="flex items-center gap-1 px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = navIcons[item.label] ?? BarChart3;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-ember/12 text-ember"
                    : "text-app-muted hover:text-app-fg"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
          <div className="ml-auto shrink-0">
            <NotificationsBell initialCount={notificationCount ?? 0} />
          </div>
        </div>
      </nav>
    </>
  );
}
