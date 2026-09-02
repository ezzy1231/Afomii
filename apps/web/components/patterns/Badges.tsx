import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "../../lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("size-4 shrink-0 text-ember", className)}
      aria-label="Verified"
    />
  );
}

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ember/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ember",
        className
      )}
    >
      <Crown className="size-3" />
      Premium
    </span>
  );
}
