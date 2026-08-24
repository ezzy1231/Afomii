import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy text-ivory shadow-sm hover:bg-navy-700 hover:shadow-card",
        accent: "bg-gold text-navy shadow-sm hover:bg-gold-300 hover:shadow-card",
        outline:
          "border border-app-border bg-transparent text-app-fg hover:border-gold/50 hover:bg-gold/5",
        ghost: "text-app-muted hover:bg-gold/10 hover:text-app-fg",
        danger: "bg-danger text-white hover:bg-danger/90",
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
