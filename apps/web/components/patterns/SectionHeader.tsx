import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  href?: string;
  actionLabel?: string;
  className?: string;
};

export function SectionHeader({
  title,
  eyebrow,
  href,
  actionLabel = "See all",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-soft">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-0.5 font-serif text-xl font-bold text-app-fg sm:text-2xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-sm font-semibold text-gold-soft transition-colors hover:text-gold"
        >
          {actionLabel}
          <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
