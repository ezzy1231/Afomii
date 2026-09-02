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
        "min-h-12 w-full rounded-xl border border-app-border bg-app-input/70 px-4 py-3 text-app-fg outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-app-muted/70 focus:border-ember/50 focus:ring-4 focus:ring-ember/12",
        className
      )}
      {...props}
    />
  );
}
