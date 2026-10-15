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
    <div className={cn("mb-6 flex items-end justify-between gap-4 border-b border-app-border pb-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-2xl font-bold text-app-fg sm:text-[2rem] sm:leading-tight">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ember underline-offset-4 hover:underline"
        >
          {actionLabel}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
        </Link>
      )}
    </div>
  );
}
