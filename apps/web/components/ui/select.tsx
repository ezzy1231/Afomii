import { cn } from "../../lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full px-4 py-3 rounded-xl border border-app-border bg-app-input/70 text-app-fg focus:border-ember/50 focus:ring-4 focus:ring-ember/12 outline-none transition-all appearance-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
