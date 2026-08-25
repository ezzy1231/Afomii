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

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type SidebarProps = {
  title: string;
  navItems: NavItem[];
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

export function Sidebar({ title, navItems }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard/restaurant" || href === "/dashboard/organizer" || href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-72 shrink-0 sticky top-0 lg:flex flex-col border-r border-white/10 bg-navy text-ivory">
        <div className="border-b border-white/10 p-7">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-gold">
              UrbanExplore
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ivory/50">
              Partner
            </span>
          </Link>
        </div>

        <div className="px-6 pb-2 pt-7">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/50">
            {title}
          </h2>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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
                    ? "bg-gold/15 text-gold shadow-[inset_0_0_0_1px_rgba(215,183,120,0.22)]"
                    : "text-ivory/60 hover:bg-white/5 hover:text-ivory"
                )}
              >
                <Icon className="size-4" strokeWidth={active ? 2.3 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/settings"
            className="flex items-center gap-3 text-sm text-ivory/60 transition-colors hover:text-ivory"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
              P
            </span>
            <span>
              <span className="block font-medium text-ivory">Partner account</span>
              <span className="block text-xs">Settings & sign out</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile tab strip */}
      <nav
        className="sticky top-0 z-30 overflow-x-auto border-b border-white/10 bg-navy/95 text-ivory nav-blur lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard"
      >
        <div className="flex gap-1 px-3 py-2">
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
                    ? "bg-white/10 text-gold"
                    : "text-ivory/60 hover:text-ivory"
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
