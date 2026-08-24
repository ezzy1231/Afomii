import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock3, Heart, MapPin, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { DateBadge, dateBadgeParts } from "./DateBadge";

export type ListingCardItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  detail: string;
  rating: string;
  imageUrl?: string | null;
  startsAt?: string | null;
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
 * Compact horizontal row card (nearby lists, event rows).
 * Restaurants show open-until meta; events show a date badge + price pill.
 */
export function ListingCard({ item, type, href, saved, className }: ListingCardProps) {
  const Icon = type === "restaurants" ? Clock3 : CalendarDays;
  const isEvent = type === "events";
  const badge = isEvent ? dateBadgeParts(item.startsAt ?? item.detail) : null;

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border border-app-border bg-app-card p-3 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card active:scale-[0.99]",
        className
      )}
    >
      {badge ? (
        <DateBadge month={badge.month} day={badge.day} size="sm" className="shrink-0 border border-app-border" />
      ) : (
        <div className="relative shrink-0">
          <Thumb item={item} className="size-16 rounded-xl" initialClass="font-serif text-2xl font-bold text-gold-soft" />
          <span
            aria-label={saved ? "Saved" : "Not saved"}
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-app-bg/70 backdrop-blur-sm"
          >
            <Heart
              className={cn(
                "size-3 transition-colors",
                saved ? "fill-danger text-danger" : "text-app-fg/70"
              )}
            />
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-app-fg transition-colors group-hover:text-gold-soft">
            {item.name}
          </h3>
          {!isEvent && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-soft">
              <Star className="size-3 fill-current" />
              {item.rating}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-app-muted">
          {item.category} · {item.location}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-app-muted">
          {isEvent ? (
            <span className="price-pill">{item.rating}</span>
          ) : (
            <>
              <Icon className="size-3.5 text-gold" />
              <span className="truncate">{item.detail}</span>
            </>
          )}
        </p>
      </div>

      {isEvent && (
        <Heart
          className={cn("size-4 shrink-0 self-start", saved ? "fill-danger text-danger" : "text-app-muted")}
        />
      )}
    </Link>
  );
}

/**
 * Large vertical card for catalogue grids and featured carousels.
 * Events render as art-directed posters: full image, date-badge overlay,
 * venue line and a From-price pill. Restaurants stay photo-forward with
 * rating + detail meta.
 */
export function ListingCardLarge({ item, type, href, saved, className }: ListingCardProps) {
  const isEvent = type === "events";
  const badge = isEvent ? dateBadgeParts(item.startsAt ?? item.detail) : null;

  if (isEvent) {
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex aspect-[4/3] w-full flex-col overflow-hidden rounded-2xl shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevate active:scale-[0.99] sm:aspect-[16/10]",
          className
        )}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(194,168,120,0.45),rgba(7,25,43,0.96))]">
            <span className="absolute inset-0 flex items-center justify-center font-serif text-5xl font-bold text-white/85">
              {item.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,25,43,0.08)_38%,rgba(7,25,43,0.9))]" />

        {badge && (
          <DateBadge
            month={badge.month}
            day={badge.day}
            size="md"
            className="absolute left-3 top-3"
          />
        )}
        <span
          aria-label={saved ? "Saved" : "Not saved"}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-app-bg/70 backdrop-blur-sm"
        >
          <Heart className={cn("size-4 transition-colors", saved ? "fill-danger text-danger" : "text-app-fg/75")} />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
            {item.category} · {item.location}
          </p>
          <h3 className="mt-0.5 truncate font-serif text-xl font-bold text-white sm:text-2xl">
            {item.name}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="price-pill !bg-white/15 !text-white backdrop-blur-sm">{item.rating}</span>
            <span className="rounded-lg bg-gold px-3.5 py-1.5 text-xs font-bold text-navy transition-transform group-hover:scale-[1.03]">
              Book now
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card active:scale-[0.99]",
        className
      )}
    >
      <div className="relative">
        <Thumb item={item} className="aspect-[4/3] h-auto w-full sm:h-40 lg:h-44" initialClass="font-serif text-4xl font-bold text-gold-soft" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-gold/30 bg-app-bg/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-soft backdrop-blur-sm">
          <Star className="size-3 fill-current" />
          {item.rating}
        </span>
        <span
          aria-label={saved ? "Saved" : "Not saved"}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-app-bg/70 backdrop-blur-sm"
        >
          <Heart className={cn("size-4 transition-colors", saved ? "fill-danger text-danger" : "text-app-fg/70")} />
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
