import Link from "next/link";
import { cn } from "../../lib/utils";

export type CategoryChipItem = {
  label: string;
  icon?: React.ReactNode;
  href?: string;
};

type CategoryChipsProps = {
  items: CategoryChipItem[];
  active?: string;
  onSelect?: (label: string) => void;
  className?: string;
};

export function CategoryChips({
  items,
  active,
  onSelect,
  className,
}: CategoryChipsProps) {
  if (onSelect) {
    return (
      <div className={cn("flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
        {items.map((item) => {
          const isActive = active === item.label;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.label)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] min-h-[36px] border",
                isActive
                  ? "border-transparent bg-ember text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] font-semibold"
                  : "border-app-border bg-app-card/70 text-app-muted hover:border-ember/30 hover:text-app-fg"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href ?? "#"}
          className="glass-subtle inline-flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-medium text-app-muted transition-all duration-200 hover:-translate-y-0.5 hover:text-app-fg active:scale-[0.97]"
        >
          <span className="text-ember">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
