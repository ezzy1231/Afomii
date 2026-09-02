import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-ink text-white",
        gold: "bg-ember/10 text-ember",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
        outline: "border border-app-border text-app-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    CONFIRMED: "success",
    COMPLETED: "success",
    PAID: "success",
    PUBLISHED: "success",
    PENDING: "warning",
    DRAFT: "outline",
    HOLD: "warning",
    FAILED: "danger",
    CANCELLED: "danger",
    REJECTED: "danger",
    REFUNDED: "danger",
    confirmed: "success",
    completed: "success",
    paid: "success",
    published: "success",
    pending: "warning",
    hold: "warning",
    draft: "outline",
    failed: "danger",
    cancelled: "danger",
    rejected: "danger",
    refunded: "danger",
  };

  return (
    <Badge variant={variantMap[status] ?? "default"}>
      {status.replace("_", " ")}
    </Badge>
  );
}
