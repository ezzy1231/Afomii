"use client";

import { cn } from "@/lib/utils";

export type CategoryOption = {
  label: string;
};

type CategoryPickerProps = {
  options: CategoryOption[];
  value: string;
  onChange: (value: string) => void;
  /** Forwarded so the wrapping <label> can name this radiogroup — htmlFor
      cannot name a composite widget, so aria-labelledby is required. */
  id?: string;
  "aria-labelledby"?: string;
};

export function CategoryPicker({
  options,
  value,
  onChange,
  id,
  ...aria
}: CategoryPickerProps) {
  return (
    <div
      {...aria}
      id={id}
      className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-app-border bg-app-card p-2"
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.label;
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.label)}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3.5 py-2 text-left text-sm transition-all active:scale-[0.99]",
              active
                ? "border-ember/40 bg-ember/10 font-semibold text-app-fg"
                : "border-transparent text-app-muted hover:bg-app-input hover:text-app-fg",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold",
                active ? "bg-ember text-on-accent" : "bg-app-input text-app-muted",
              )}
            >
              {opt.label.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{opt.label}</span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                active ? "border-ember/40" : "border-app-border",
              )}
            >
              {active && <span className="size-2 rounded-full bg-ember" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
