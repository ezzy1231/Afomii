import { BadgeCheck, Crown } from "lucide-react";
import { cn } from "../../lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("size-4 shrink-0 text-gold", className)}
      aria-label="Verified"
    />
  );
}

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-navy",
        className
      )}
    >
      <Crown className="size-3" />
      Premium
    </span>
  );
}
