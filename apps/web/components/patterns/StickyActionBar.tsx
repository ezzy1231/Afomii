import Link from "next/link";
import { cn } from "../../lib/utils";

type StickyActionBarProps = {
  primary: { label: string; href?: string; onClick?: () => void; disabled?: boolean };
  secondary?: { label: string; href?: string; onClick?: () => void; disabled?: boolean };
  className?: string;
};

const baseBtn =
  "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";

export function StickyActionBar({
  primary,
  secondary,
  className,
}: StickyActionBarProps) {
  const primaryBtn = primary.href ? (
    <Link
      href={primary.href}
      className={cn(baseBtn, "bg-gold text-navy shadow-lg shadow-gold/20")}
    >
      {primary.label}
    </Link>
  ) : (
    <button
      type="button"
      onClick={primary.onClick}
      disabled={primary.disabled}
      className={cn(baseBtn, "bg-gold text-navy shadow-lg shadow-gold/20")}
    >
      {primary.label}
    </button>
  );

  const secondaryBtn = secondary ? (
    secondary.href ? (
      <Link
        href={secondary.href}
        className={cn(baseBtn, "border border-app-border bg-app-panel text-app-fg")}
      >
        {secondary.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={secondary.onClick}
        disabled={secondary.disabled}
        className={cn(baseBtn, "border border-app-border bg-app-panel text-app-fg")}
      >
        {secondary.label}
      </button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-8 border-t border-app-border bg-app-bg/90 px-4 py-3 backdrop-blur-lg sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none safe-bottom",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl gap-3">
        {secondaryBtn}
        {primaryBtn}
      </div>
    </div>
  );
}
