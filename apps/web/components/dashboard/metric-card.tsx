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
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-app-muted font-medium">{title}</p>
            <p className="text-3xl font-bold text-app-fg font-heading">
              {value}
            </p>
            {trend && (
              <p
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-500"
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
            <div className="p-3 bg-gold/10 rounded-lg text-gold">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
