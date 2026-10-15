"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, CarFront, Coffee, Martini, UtensilsCrossed } from "lucide-react";

const categories = [
  { href: "/restaurants", label: "Restaurants", note: "Reserve a table", icon: UtensilsCrossed },
  { href: "/events", label: "Events", note: "Buy tickets", icon: CalendarDays },
  { href: "/ride", label: "Rides", note: "Estimate a fare in ETB", icon: CarFront },
  { href: "/restaurants?q=cafe", label: "Cafés", note: "Search cafés", icon: Coffee },
  { href: "/restaurants?q=bar", label: "Bars", note: "Search bars", icon: Martini },
];

/** Quick-browse index: a single ruled strip, like a printed table of contents. */
export default function CategoryRow() {
  return (
    <nav aria-label="Browse categories" className="grid grid-cols-2 overflow-hidden rounded-2xl border border-app-border bg-app-card sm:grid-cols-3 lg:grid-cols-5">
      {categories.map(({ href, label, note, icon: Icon }, i) => (
        <Link
          key={label}
          href={href}
          className={`group relative flex min-h-[88px] items-center gap-3 border-app-border p-4 transition-colors hover:bg-app-alt lg:border-r lg:last:border-r-0 ${i === 0 ? "col-span-2 border-b sm:col-span-1 sm:border-b-0 sm:border-r" : "border-b sm:border-b-0 sm:border-r"}`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember-soft text-ember transition-transform duration-300 group-hover:-rotate-6">
            <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold leading-tight text-app-fg">{label}</span>
            <span className="block truncate text-xs text-app-muted">{note}</span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-app-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember" aria-hidden />
        </Link>
      ))}
    </nav>
  );
}
