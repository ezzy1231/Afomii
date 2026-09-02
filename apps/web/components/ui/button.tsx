import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-ember to-ember-deep text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] hover:shadow-[0_4px_16px_rgb(var(--ember-rgb)/0.4)] hover:-translate-y-px",
        accent:
          "bg-ember/10 text-ember border border-ember/25 hover:bg-ember/15 hover:border-ember/40",
        outline:
          "glass-subtle border border-app-border text-app-fg hover:border-ember/30 hover:shadow-glass",
        ghost: "text-app-muted hover:bg-app-elevated/60 hover:text-app-fg",
        danger: "bg-danger text-white hover:bg-danger/90 shadow-soft",
      },
      size: {
        sm: "h-10 px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
