"use client";

import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export type FilterOption = { label: string; icon?: React.ReactNode };
export type FilterGroup = { key: string; title: string; options: FilterOption[] };

type FilterSheetProps = {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onToggle: (groupKey: string, label: string) => void;
  onClear: () => void;
  open: boolean;
  onClose: () => void;
  resultCount: number;
};

export function FilterSheet({
  groups,
  selected,
  onToggle,
  onClear,
  open,
  onClose,
  resultCount,
}: FilterSheetProps) {
  const body = (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.key}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-app-muted">
            {group.title}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.options.map((option) => {
              const active = selected[group.key]?.includes(option.label);
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onToggle(group.key, option.label)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                    active
                      ? "border-ember/40 bg-ember/10 text-ember"
                      : "border-app-border bg-app-input/60 text-app-muted hover:border-ember/25 hover:text-app-fg"
                  )}
                >
                  {option.icon && <span className="shrink-0 text-ember">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const actions = (
    <div className="mt-6 flex items-center gap-3 border-t border-app-border pt-4">
      <button
        type="button"
        onClick={onClear}
        className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-semibold text-app-muted transition-colors hover:text-app-fg"
      >
        Clear all
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-xl bg-gradient-to-br from-ember to-ember-deep px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-transform active:scale-[0.98]"
      >
        Show {resultCount} result{resultCount === 1 ? "" : "s"}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile bottom sheet */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        {...((!open ? { inert: "" } : {}) as React.HTMLAttributes<HTMLDivElement>)}
      >
        <div
          className={cn(
            "glass-backdrop absolute inset-0 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] border-t border-white/50 bg-white/80 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-glass-strong backdrop-blur-2xl backdrop-saturate-150 transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#1E1E24]/85",
            open ? "translate-y-0" : "translate-y-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-app-fg">Filters</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="flex size-9 items-center justify-center rounded-full bg-app-elevated/70 text-app-muted transition-colors hover:text-app-fg"
            >
              <X className="size-4" />
            </button>
          </div>
          {body}
          {actions}
        </div>
      </div>

      {/* Desktop inline panel */}
      {open && (
        <div className="glass animate-pop-in mb-6 hidden rounded-3xl p-6 lg:block">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-app-fg">Filters</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="flex size-9 items-center justify-center rounded-full bg-app-elevated/70 text-app-muted transition-colors hover:text-app-fg"
            >
              <X className="size-4" />
            </button>
          </div>
          {body}
          {actions}
        </div>
      )}
    </>
  );
}
