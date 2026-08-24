'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'

/**
 * Eyebrow-labeled progress stepper ported from the Stitch signup artboards:
 * gold-filled completed circles with a check, ringed current step, and a
 * continuous connector line that turns gold as it is passed.
 */
export function SignupStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <div className="flex items-start">
        {steps.map((label, i) => {
          const n = i + 1
          const done = n < current
          const active = n === current
          return (
            <Fragment key={label}>
              {i > 0 && (
                <div
                  aria-hidden
                  className={cn(
                    'mt-[15px] h-0.5 flex-1 rounded-full transition-colors',
                    n <= current ? 'bg-gold' : 'bg-[var(--border)]'
                  )}
                />
              )}
              <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                    done && 'border-gold bg-gold text-navy',
                    active && 'border-2 border-gold bg-app-card text-app-fg',
                    !done && !active && 'border-app-border bg-app-input text-app-muted'
                  )}
                >
                  {done ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    n
                  )}
                </div>
                <span
                  className={cn(
                    'eyebrow text-center leading-tight',
                    done || active ? 'text-app-fg' : 'text-app-muted'
                  )}
                >
                  {label}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </nav>
  )
}
