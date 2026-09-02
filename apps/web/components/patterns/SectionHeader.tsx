import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-app-fg sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="glass-subtle inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-app-fg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass active:translate-y-0"
        >
          {actionLabel}
          <ArrowRight className="size-4 text-ember" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}
