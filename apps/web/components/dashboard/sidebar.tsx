"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen bg-navy text-ivory flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-gold">
              UrbanExplore
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ivory/50">
              Partner
            </span>
          </Link>
        </div>

        <div className="px-6 pt-6 pb-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ivory/50">
            {title}
          </h2>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-white/10 text-gold"
                    : "text-ivory/60 hover:bg-white/5 hover:text-ivory"
                )}
              >
                <span className="text-base">{item.icon}</span>
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
        className="lg:hidden sticky top-0 z-30 bg-navy text-ivory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard"
      >
        <div className="flex gap-1 px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-white/10 text-gold"
                    : "text-ivory/60 hover:text-ivory"
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
