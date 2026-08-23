import { cn } from "../../lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "w-full px-4 py-3 rounded-xl border border-app-border bg-app-input text-app-fg placeholder:text-app-muted/70 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all",
        className
      )}
      {...props}
    />
  );
}
