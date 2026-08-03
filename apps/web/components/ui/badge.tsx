import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-navy text-ivory",
        gold: "bg-gold text-navy",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800",
        outline: "border border-navy text-navy",
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
    PENDING: "warning",
    CANCELLED: "danger",
    REJECTED: "danger",
    DRAFT: "outline",
    PUBLISHED: "success",
  };

  return (
    <Badge variant={variantMap[status] ?? "default"}>
      {status.replace("_", " ")}
    </Badge>
  );
}
