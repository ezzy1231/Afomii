import Link from "next/link";
import { CalendarDays, CarFront, MoreHorizontal, Store, UtensilsCrossed } from "lucide-react";

const categories = [
  { href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/ride", label: "Rides", icon: CarFront },
  { href: "/restaurants?q=cafe", label: "Cafés", icon: Store },
  { href: "/restaurants?q=bar", label: "Bars", icon: MoreHorizontal },
];

/**
 * Icon chip row for the home page — the marketplace pattern every discovery
 * app uses as its primary category entry point. Horizontal snap on mobile.
 */
export default function CategoryRow() {
  return (
    <nav aria-label="Browse categories" className="snap-row !py-1">
      {categories.map(({ href, label, icon: Icon }) => (
        <Link key={label} href={href} className="chip tap-target justify-center">
          <Icon className="size-4 text-gold" strokeWidth={2} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
