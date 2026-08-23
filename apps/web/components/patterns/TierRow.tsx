"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

export type Tier = {
  id: string;
  name: string;
  price: number;
  remaining: number;
  badge?: string;
  premium?: boolean;
  salesOpen?: boolean;
};

type TierRowProps = {
  tier: Tier;
  quantity: number;
  currency?: string;
  onQuantityChange: (id: string, qty: number) => void;
  className?: string;
};

export function TierRow({
  tier,
  quantity,
  currency = "ETB",
  onQuantityChange,
  className,
}: TierRowProps) {
  const soldOut = tier.remaining <= 0;
  const offSale = tier.salesOpen === false;
  const disabled = soldOut || offSale;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-app-border py-3.5 last:border-0",
        disabled && "opacity-50",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-semibold text-app-fg", disabled && "text-app-muted")}>
            {tier.name}
          </span>
          {tier.premium && !disabled && (
            <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-navy">
              Premium
            </span>
          )}
        </div>
        <div className="mt-0.5 text-sm tabular-nums text-app-muted">
          {currency} {tier.price.toLocaleString()}
        </div>
        <div
          className={cn(
            "mt-0.5 text-xs",
            disabled ? "text-danger" : "text-app-muted"
          )}
        >
          {soldOut ? "Sold Out" : offSale ? "Sales closed" : `${tier.remaining} left`}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-md border border-app-border px-1 py-1">
        <button
          type="button"
          aria-label={`Decrease ${tier.name} quantity`}
          disabled={disabled}
          onClick={() => onQuantityChange(tier.id, Math.max(0, quantity - 1))}
          className="flex size-7 items-center justify-center rounded text-app-muted transition-colors hover:text-app-fg disabled:opacity-40"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-app-fg">
          {quantity}
        </span>
        <button
          type="button"
          aria-label={`Increase ${tier.name} quantity`}
          disabled={disabled || quantity >= tier.remaining}
          onClick={() => onQuantityChange(tier.id, Math.min(tier.remaining, quantity + 1))}
          className="flex size-7 items-center justify-center rounded text-app-muted transition-colors hover:text-app-fg disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
