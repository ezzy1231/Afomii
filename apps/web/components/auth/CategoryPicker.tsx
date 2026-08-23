'use client'

import { cn } from '@/lib/utils'

export type CategoryOption = {
  label: string
  icon: string
}

type CategoryPickerProps = {
  options: CategoryOption[]
  value: string
  onChange: (value: string) => void
}

export function CategoryPicker({ options, value, onChange }: CategoryPickerProps) {
  return (
    <div
      className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-app-border bg-app-card p-2"
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = value === opt.label
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.label)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-all active:scale-[0.99]',
              active
                ? 'border-gold bg-gold/10 font-semibold text-app-fg'
                : 'border-transparent text-app-muted hover:bg-app-input hover:text-app-fg'
            )}
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md text-base',
                active ? 'bg-gold/20' : 'bg-app-input'
              )}
            >
              {opt.icon}
            </span>
            <span className="min-w-0 flex-1 truncate">{opt.label}</span>
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                active ? 'border-gold' : 'border-app-border'
              )}
            >
              {active && <span className="size-2 rounded-full bg-gold" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
