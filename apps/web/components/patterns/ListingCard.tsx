"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock3, Heart, MapPin, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { loadSavedIds, toggleSavedId } from "../../lib/saved";
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
  onToggleSaved?: (id: string, nextSaved: boolean) => void;
  className?: string;
};

/**
 * Shared save toggle: reads the persisted state after mount (avoids SSR
 * hydration mismatch — localStorage is empty server-side) and keeps the
 * `afomii.saved` list in sync for the My Plans → Saved tab.
 */
function useSavedToggle(id: string, onToggleSaved?: (id: string, next: boolean) => void) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(loadSavedIds().includes(id));
  }, [id]);

  const toggle = (e: React.MouseEvent) => {
    // The card wraps this in a <Link> — keep the click on the heart.
    e.preventDefault();
    e.stopPropagation();
    const next = toggleSavedId(id);
    setSaved(next);
    onToggleSaved?.(id, next);
  };

  return { saved, toggle };
}

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
        "flex items-center justify-center bg-gradient-to-br from-ember/25 to-ember/60",
        className,
      )}
    >
      <span className={initialClass}>{item.name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

/** Round heart button overlaying a card. */
function SaveHeart({
  saved,
  onToggle,
  name,
  className,
}: {
  saved: boolean;
  onToggle: (e: React.MouseEvent) => void;
  name: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={saved ? `Unsave ${name}` : `Save ${name}`}
      aria-pressed={saved}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-white/70 text-app-fg shadow-soft backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-90 dark:bg-white/15",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          saved ? "fill-danger text-danger" : "text-app-fg/75",
        )}
      />
    </button>
  );
}

/**
 * Compact horizontal row card (nearby lists, event rows).
 * Restaurants show open-until meta; events show a date badge + price pill.
 */
export function ListingCard({
  item,
  type,
  href,
  onToggleSaved,
  className,
}: ListingCardProps) {
  const Icon = type === "restaurants" ? Clock3 : CalendarDays;
  const isEvent = type === "events";
  const badge = isEvent ? dateBadgeParts(item.startsAt ?? item.detail) : null;
  const { saved, toggle } = useSavedToggle(item.id, onToggleSaved);

  return (
    <div className={cn("relative", className)}>
      <Link
        href={href}
        className="glass glass-hover group flex w-full items-center gap-3 rounded-2xl p-3"
      >
        {badge ? (
          <DateBadge month={badge.month} day={badge.day} size="sm" className="date-badge-on-light shrink-0" />
        ) : (
          <div className="relative shrink-0">
            <Thumb item={item} className="size-16 rounded-xl" initialClass="text-2xl font-bold text-white" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-app-fg transition-colors group-hover:text-ember">
              {item.name}
            </h3>
            {!isEvent && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ember/10 px-2 py-0.5 text-xs font-semibold text-ember">
                <Star className="size-3 fill-current" />
                {item.rating}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-app-muted">
            {item.category} · {item.location}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-app-muted">
            {isEvent ? (
              <span className="price-pill">{item.rating}</span>
            ) : (
              <>
                <Icon className="size-3.5 text-ember" strokeWidth={2.5} />
                <span className="truncate">{item.detail}</span>
              </>
            )}
          </p>
        </div>
      </Link>
      {/* Save toggle — a sibling of the card link (buttons can't nest in <a>). */}
      <SaveHeart
        saved={saved}
        onToggle={toggle}
        name={item.name}
        className="absolute right-3 top-3 size-7"
      />
    </div>
  );
}

/**
 * Large vertical card for catalogue grids and featured carousels.
 * Events render as art-directed posters; restaurants stay photo-forward.
 * The save heart is a real toggle overlaid outside the card link.
 */
export function ListingCardLarge({
  item,
  type,
  href,
  onToggleSaved,
  className,
}: ListingCardProps) {
  const isEvent = type === "events";
  const badge = isEvent ? dateBadgeParts(item.startsAt ?? item.detail) : null;
  const reduce = useReducedMotion();
  const { saved, toggle } = useSavedToggle(item.id, onToggleSaved);

  if (isEvent) {
    return (
      <motion.div
        whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
        whileTap={reduce ? undefined : { scale: 0.985 }}
        className={cn("relative", className)}
      >
        <Link
          href={href}
          className="group relative flex aspect-[4/3] w-full flex-col overflow-hidden rounded-3xl shadow-glass transition-shadow duration-200 hover:shadow-glass-strong sm:aspect-[16/10]"
        >
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 90vw, 420px"
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-ember/60 to-ember-deep/95">
              <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white/90">
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.05)_30%,rgba(10,10,12,0.8))]" />

          {badge && (
            <DateBadge
              month={badge.month}
              day={badge.day}
              size="md"
              className="absolute left-3 top-3"
            />
          )}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {item.category} · {item.location}
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
              {item.name}
            </h3>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="price-pill">{item.rating}</span>
              <span className="rounded-xl bg-ember px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.4)] transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95">
                Book now
              </span>
            </div>
          </div>
        </Link>
        <SaveHeart
          saved={saved}
          onToggle={toggle}
          name={item.name}
          className="absolute right-3 top-3"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className={cn("relative", className)}
    >
      <Link
        href={href}
        className="glass glass-hover group flex h-full w-full flex-col overflow-hidden rounded-3xl"
      >
        <div className="relative">
          <Thumb
            item={item}
            className="aspect-[4/3] h-auto w-full sm:h-40 lg:h-44"
            initialClass="text-4xl font-bold text-white"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[10px] font-semibold text-app-fg shadow-soft backdrop-blur-md dark:bg-white/15">
            <Star className="size-3 fill-ember text-ember" />
            {item.rating}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="truncate text-lg font-semibold text-app-fg transition-colors group-hover:text-ember">
            {item.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-app-muted">
            <MapPin className="size-3.5 shrink-0 text-ember" strokeWidth={2.5} />
            {item.location}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-app-muted">
            {item.category} · {item.detail}
          </p>
          <span className="mt-3 h-1 w-10 rounded-full bg-ember/60 transition-all duration-300 group-hover:w-14 group-hover:bg-ember" />
        </div>
      </Link>
      <SaveHeart
        saved={saved}
        onToggle={toggle}
        name={item.name}
        className="absolute right-3 top-3"
      />
    </motion.div>
  );
}
