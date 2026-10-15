"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock3, Heart, MapPin, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { loadSavedIds, toggleSavedId } from "../../lib/saved";
import { DateBadge, dateBadgeParts } from "./DateBadge";
import { VerifiedBadge } from "./Badges";

export type ListingCardItem = {
  id: string;
  name: string;
  category: string;
  location: string;
  detail: string;
  rating: string;
  imageUrl?: string | null;
  startsAt?: string | null;
  isVerified?: boolean;
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

function isNumericRating(rating: string) {
  return /^\d+(\.\d+)?$/.test(rating.trim());
}

/** Rating label that never dresses "New" up as a score. */
function RatingTag({ rating, className }: { rating: string; className?: string }) {
  const numeric = isNumericRating(rating);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        numeric ? "bg-ember-soft text-app-fg" : "border border-app-border text-app-muted",
        className,
      )}
    >
      {numeric && <Star className="size-3 fill-signal text-signal" aria-hidden />}
      {numeric ? <><span className="sr-only">Rated </span>{rating}</> : rating}
    </span>
  );
}

function Thumb({
  item,
  className,
  initialClass,
  sizes = "240px",
}: {
  item: ListingCardItem;
  className?: string;
  initialClass: string;
  sizes?: string;
}) {
  if (item.imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-app-elevated", className)}>
        <Image
          src={item.imageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={cn("dot-grid flex items-center justify-center bg-app-elevated", className)}
    >
      <span className={cn("font-display text-app-muted/70", initialClass)}>{item.name.charAt(0).toUpperCase()}</span>
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
        "flex size-11 items-center justify-center rounded-full",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full border border-app-border bg-app-card text-app-fg shadow-soft transition-transform duration-200 hover:scale-105 active:scale-90">
        <Heart
          className={cn(
            "size-4 transition-colors",
            saved ? "save-pop fill-signal text-signal" : "text-app-fg",
          )}
        />
      </span>
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
  const isEvent = type === "events";
  const badge = isEvent ? dateBadgeParts(item.startsAt ?? item.detail) : null;
  const { saved, toggle } = useSavedToggle(item.id, onToggleSaved);

  return (
    <div className={cn("relative", className)}>
      <Link
        href={href}
        className="glass glass-hover group flex w-full items-center gap-4 rounded-2xl p-3 pr-14"
      >
        {badge ? (
          <DateBadge month={badge.month} day={badge.day} size="sm" className="date-badge-on-light shrink-0" />
        ) : (
          <Thumb item={item} className="size-16 shrink-0 rounded-xl" initialClass="text-2xl font-bold" sizes="64px" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-app-fg underline-offset-4 group-hover:underline">
              {item.name}
            </h3>
            {item.isVerified && <VerifiedBadge className="size-4 shrink-0" />}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-app-muted">
            {item.category} · {item.location}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-app-muted">
            {isEvent ? (
              <>
                <CalendarDays className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
                <span className="truncate">{item.detail}</span>
                <span className="price-pill">{item.rating}</span>
              </>
            ) : (
              <>
                <RatingTag rating={item.rating} />
                <Clock3 className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
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
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
      />
    </div>
  );
}

/**
 * Large vertical card for catalogue grids and featured carousels.
 * Photo first, then a ledger-style caption block. Events carry a date tab.
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

  return (
    <motion.div
      whileTap={reduce ? undefined : { scale: 0.99 }}
      className={cn("relative h-full", className)}
    >
      <Link
        href={href}
        className="glass glass-hover group flex h-full w-full flex-col overflow-hidden rounded-2xl"
      >
        <div className="relative">
          <Thumb
            item={item}
            className="aspect-[4/3] w-full"
            initialClass="text-6xl font-bold"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 46vw, 400px"
          />
          {badge && (
            <DateBadge month={badge.month} day={badge.day} size="md" className="absolute left-3 top-3" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-gold-text">
            {item.category}
          </p>
          <div className="mt-1.5 flex items-start gap-2">
            <h3 className="line-clamp-2 text-xl font-bold leading-tight text-app-fg">
              {item.name}
            </h3>
            {item.isVerified && <VerifiedBadge className="mt-1 size-4 shrink-0" />}
          </div>
          <p className="mt-2 flex items-center gap-1.5 truncate text-[13px] text-app-muted">
            <MapPin className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            <span className="truncate">{item.location}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-app-muted">
            {isEvent ? <CalendarDays className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden /> : <Clock3 className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />}
            <span className="truncate">{item.detail}</span>
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-3.5 border-t border-app-border pt-3.5">
            {isEvent ? <span className="price-pill">{item.rating}</span> : <RatingTag rating={item.rating} />}
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-ember">
              {isEvent ? "Get tickets" : "Reserve"}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </span>
          </div>
        </div>
      </Link>
      <SaveHeart
        saved={saved}
        onToggle={toggle}
        name={item.name}
        className="absolute right-1.5 top-1.5"
      />
    </motion.div>
  );
}
