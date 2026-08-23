import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock3, Heart, MapPin, Star } from "lucide-react";
import { cn } from "../../lib/utils";

export type ListingCardItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  detail: string;
  rating: string;
  imageUrl?: string | null;
};

type ListingCardProps = {
  item: ListingCardItem;
  type: "restaurants" | "events";
  href: string;
  saved?: boolean;
  className?: string;
};

function Thumb({
  item,
  className,
  initialClass,
}: {
  item: ListingCardItem;
  className?: string;
  initialClass: string;
}) {
  if (item.imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-app-input", className)}>
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="240px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[linear-gradient(135deg,rgba(215,183,120,0.25),rgba(11,29,49,0.9))]",
        className
      )}
    >
      <span className={initialClass}>{item.name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

/**
 * Compact horizontal card used in home carousels and nearby lists.
 */
export function ListingCard({ item, type, href, saved, className }: ListingCardProps) {
  const Icon = type === "restaurants" ? Clock3 : CalendarDays;

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border border-app-border bg-app-panel p-3 transition-all duration-200 hover:border-gold/40 hover:shadow-[var(--shadow-md)] active:scale-[0.99]",
        className
      )}
    >
      <div className="relative shrink-0">
        <Thumb item={item} className="size-16 rounded-xl" initialClass="font-serif text-2xl font-bold text-gold-soft" />
        <button
          type="button"
          aria-label={saved ? "Unsave" : "Save"}
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-app-bg/60 backdrop-blur-sm"
        >
          <Heart
            className={cn(
              "size-3 transition-colors",
              saved ? "fill-danger text-danger" : "text-app-fg/70"
            )}
          />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-app-fg transition-colors group-hover:text-gold-soft">
            {item.name}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-soft">
            <Star className="size-3 fill-current" />
            {item.rating}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-app-muted">
          {item.category} · {item.location}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-app-muted">
          <Icon className="size-3.5 text-gold" />
          <span className="truncate">{item.detail}</span>
        </p>
      </div>
    </Link>
  );
}

/**
 * Large vertical card for catalogue grids and featured carousels.
 */
export function ListingCardLarge({ item, type, href, className }: ListingCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-app-border bg-app-panel transition-all duration-200 hover:border-gold/40 hover:shadow-[var(--shadow-md)] active:scale-[0.99]",
        className
      )}
    >
      <div className="relative">
        <Thumb item={item} className="h-32 w-full sm:h-36" initialClass="font-serif text-4xl font-bold text-gold-soft" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/30 bg-app-bg/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-soft backdrop-blur-sm">
          <Star className="size-3 fill-current" />
          {item.rating}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-serif text-lg font-bold text-app-fg transition-colors group-hover:text-gold-soft">
          {item.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-app-muted">
          <MapPin className="size-3.5 shrink-0 text-gold" />
          {item.location}
        </p>
        <p className="mt-1 truncate text-xs text-app-muted">
          {item.category} · {item.detail}
        </p>
      </div>
    </Link>
  );
}
