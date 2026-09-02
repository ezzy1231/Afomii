import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function MetricCard({
  title,
  value,
  trend,
  subtitle,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-app-muted font-medium">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-app-fg tabular-nums truncate">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-danger"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                <span className="text-app-muted ml-1">vs last week</span>
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-app-muted">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="shrink-0 rounded-xl bg-ember/10 p-3 text-ember">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
