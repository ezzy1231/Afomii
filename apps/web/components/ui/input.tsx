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
        "w-full px-4 py-3 rounded-lg border border-gray-200 bg-white dark:bg-navy-800 text-app-fg placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all",
        className
      )}
      {...props}
    />
  );
}
