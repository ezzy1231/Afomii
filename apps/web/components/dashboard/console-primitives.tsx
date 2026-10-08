'use client'

import { CalendarDays, Ticket, TrendingUp, Users, type LucideIcon } from 'lucide-react'
import type { ConsoleStat } from '@/lib/console-types'
import { CONSOLE_CARD, TONE_INK, TONE_SURFACE } from './console-tokens'
import { cn } from '@/lib/utils'

const STAT_ICONS: Record<ConsoleStat['icon'], LucideIcon> = {
  calendar: CalendarDays,
  ticket: Ticket,
  revenue: TrendingUp,
  attendees: Users,
}

/** Pastel circular icon + label + big number + muted subtext. */
export function ConsoleStatCard({ stat }: { stat: ConsoleStat }) {
  const Icon = STAT_ICONS[stat.icon]
  return (
    <div className={cn(CONSOLE_CARD, 'flex items-start gap-4 p-5')}>
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full',
          TONE_SURFACE[stat.tone],
          TONE_INK[stat.tone],
        )}
      >
        <Icon className="size-[19px]" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-console-muted">{stat.label}</p>
        <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-console-ink tabular-nums">
          {stat.value}
        </p>
        <p className="mt-1.5 truncate text-xs text-console-muted">{stat.subtext}</p>
      </div>
    </div>
  )
}

export function ConsoleStatRow({ stats }: { stats: ConsoleStat[] }) {
  return (
    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <ConsoleStatCard key={stat.label} stat={stat} />
      ))}
    </section>
  )
}

/** Card heading row: title + optional trailing control. */
export function ConsoleCardHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-console-border px-5 py-4">
      <h2 className="text-[15px] font-bold text-console-ink">{title}</h2>
      {action}
    </div>
  )
}

/**
 * Vertical rhythm + optional heading block for console sub-pages.
 *
 * Console counterpart to `ConsolePageShell` in `./console`, which owns its
 * own padding and caps width at `max-w-5xl` — wrong once the page sits
 * inside `ConsoleShell`, which already supplies the gutter and the rail.
 * Omit `title` and pass the page's own heading as a child instead.
 */
export function ConsoleStack({
  eyebrow,
  title,
  subtitle,
  action,
  children,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {title && (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-console-muted">
                {eyebrow}
              </p>
            )}
            <h2
              className={cn(
                eyebrow ? 'mt-2' : '',
                'text-2xl font-bold tracking-tight text-console-ink',
              )}
            >
              {title}
            </h2>
            {subtitle && <p className="mt-1.5 text-sm text-console-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </div>
  )
}