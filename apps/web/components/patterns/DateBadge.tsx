import { cn } from "../../lib/utils";

/**
 * Eventbrite-style month/day block used on event cards and rows.
 * Accepts either a Date-parsable string or explicit parts.
 */
export function DateBadge({
  month,
  day,
  size = "md",
  className,
}: {
  month: string;
  day: string | number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "date-badge",
        size === "sm" && "px-2 py-1",
        size === "lg" && "px-3.5 py-2 shadow-lg",
        className
      )}
    >
      <span
        className={cn(
          "date-badge-month",
          size === "sm" && "text-[9px]",
          size === "lg" && "text-xs"
        )}
      >
        {month}
      </span>
      <span
        className={cn(
          "date-badge-day",
          size === "sm" && "text-sm",
          size === "lg" && "text-2xl"
        )}
      >
        {day}
      </span>
    </span>
  );
}

/** Parse "Dec 21"-style labels or ISO strings into badge parts. */
export function dateBadgeParts(value?: string | null): { month: string; day: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(date.getFullYear(), date.getMonth(), 15))
    ),
    day: String(date.getDate()),
  };
}
