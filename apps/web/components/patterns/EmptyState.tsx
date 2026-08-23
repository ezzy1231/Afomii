import { cn } from "../../lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-app-border bg-app-panel/50 px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-bold text-app-fg">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-sm text-sm text-app-muted">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
