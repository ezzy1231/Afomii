"use client";

import Link from "next/link";
import { CalendarDays, CarFront, Coffee, Martini, UtensilsCrossed } from "lucide-react";

const categories = [
  { href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/ride", label: "Rides", icon: CarFront },
  { href: "/restaurants?q=cafe", label: "Cafés", icon: Coffee },
  { href: "/restaurants?q=bar", label: "Bars", icon: Martini },
];

/**
 * Icon chip row for the home page — soft glass pills.
 */
export default function CategoryRow() {
  return (
    <nav aria-label="Browse categories" className="snap-row !py-1">
      {categories.map(({ href, label, icon: Icon }, i) => (
        <Link
          key={label}
          href={href}
          className="chip tap-target justify-center"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Icon className="size-4 text-ember" strokeWidth={2.5} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
