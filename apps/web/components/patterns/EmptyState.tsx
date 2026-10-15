import { cn } from "../../lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-app-border bg-app-alt px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-app-border bg-app-card text-ember">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-app-fg">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm leading-6 text-app-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
