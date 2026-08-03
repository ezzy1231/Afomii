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

  return (
    <aside className="w-64 min-h-screen bg-navy text-ivory flex flex-col">
      <div className="p-6 border-b border-navy-700">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-heading font-bold text-gold">
            UrbanExplore
          </span>
          <span className="text-xs text-gray-400">Partner</span>
        </Link>
      </div>

      <div className="px-4 pt-6 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard/restaurant" && pathname.startsWith(item.href)) ||
            (item.href === "/dashboard/restaurant" && pathname === "/dashboard/restaurant") ||
            (item.href === "/dashboard/organizer" && pathname === "/dashboard/organizer");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gold/20 text-gold"
                  : "text-gray-400 hover:bg-navy-700 hover:text-ivory"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-navy-700">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
            A
          </div>
          <div>
            <p className="text-ivory font-medium">Admin</p>
            <p className="text-xs">admin@urbanexplore.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
