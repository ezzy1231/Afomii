import { BadgeCheck } from "lucide-react";
import { cn } from "../../lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("size-4 shrink-0 text-ember", className)}
      aria-label="Verified"
    />
  );
}
