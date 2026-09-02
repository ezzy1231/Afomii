'use client'

import Link from 'next/link'
import { CONSOLE_CARD } from './console-shared'
import { cn } from '@/lib/utils'

/**
 * Shared console UI primitives (client components) for partner/admin
 * surfaces. Glass design system: neutral base, single ember accent,
 * soft layered depth — theme-aware (light + dark).
 *
 * NOTE: server components can render these components but cannot CALL plain
 * functions exported from this "use client" file — shared constants/helpers
 * live in `./console-shared` instead.
 */

export function ConsolePageShell({
  children,
  maxWidth = 'max-w-5xl',
}: {
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <div className="min-h-full px-4 pb-16 pt-8 text-app-fg sm:px-6 lg:px-8">
      <div className={cn('mx-auto w-full space-y-8', maxWidth)}>{children}</div>
    </div>
  )
}

export function ConsoleHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-app-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-app-border pb-3 text-xl font-bold">{children}</h2>
  )
}

export function StatusPill({ status, tone }: { status: string; tone?: 'ok' | 'bad' | 'gold' | 'info' }) {
  const toneCls =
    tone === 'ok'
      ? 'bg-success/15 text-success'
      : tone === 'bad'
        ? 'bg-danger/15 text-danger'
        : tone === 'gold'
          ? 'bg-ember/12 text-ember'
          : 'bg-app-elevated/80 text-app-muted'
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        toneCls
      )}
    >
      {status}
    </span>
  )
}

export function ConsoleKpiCard({
  label,
  value,
  trend,
  accent = false,
}: {
  label: string
  value: string
  trend?: { direction: 'up' | 'down' | 'flat'; text: string }
  accent?: boolean
}) {
  return (
    <div className={cn(CONSOLE_CARD, 'glass-hover flex min-h-32 flex-col justify-between p-4')}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
        {label}
      </span>
      <div>
        <span
          className={cn(
            'block text-4xl font-bold tabular-nums',
            accent ? 'text-ember' : 'text-app-fg'
          )}
        >
          {value}
        </span>
        {trend && trend.direction !== 'flat' && (
          <span
            className={cn(
              'mt-1 block text-xs font-semibold tabular-nums',
              trend.direction === 'up' ? 'text-success' : 'text-danger'
            )}
          >
            {trend.direction === 'up' ? '▲' : '▼'} {trend.text}
          </span>
        )}
        {trend && trend.direction === 'flat' && (
          <span className="mt-1 block text-xs font-medium text-app-muted">{trend.text}</span>
        )}
      </div>
    </div>
  )
}

/** Pill-style segmented control with smooth tab transitions. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div className="glass flex rounded-xl p-1" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'min-h-9 flex-1 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-all duration-200',
            value === opt.value
              ? 'bg-gradient-to-br from-ember to-ember-deep text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)]'
              : 'text-app-muted hover:text-app-fg'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200',
        active
          ? 'border-ember/40 bg-ember/12 text-ember'
          : 'border-app-border text-app-muted hover:border-ember/30 hover:text-app-fg'
      )}
    >
      {children}
    </button>
  )
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        // Negative margin keeps the visual footprint while padding widens the
        // tap target to the 44px minimum.
        'relative -m-2.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0 transition-colors duration-200',
        checked ? 'bg-success' : 'bg-app-elevated'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-out',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

export function ConsoleSkeletonRow({ count = 3, height = 'h-20' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(height, 'animate-pulse rounded-xl bg-app-input/80')} />
      ))}
    </div>
  )
}

/** Range selector rendered as links so it works inside server components. */
export function ConsoleRangeLinks({
  current,
}: {
  current: '7d' | '30d' | '90d'
}) {
  const options: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d']
  return (
    <div className="glass flex w-fit rounded-xl p-1" role="tablist" aria-label="Date range">
      {options.map((range) => (
        <Link
          key={range}
          href={`?range=${range}`}
          scroll={false}
          role="tab"
          aria-selected={current === range}
          className={cn(
            'min-h-9 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
            current === range
              ? 'bg-gradient-to-br from-ember to-ember-deep text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)]'
              : 'text-app-muted hover:text-app-fg'
          )}
        >
          {range}
        </Link>
      ))}
    </div>
  )
}

/**
 * Dependency-free SVG area-line (ember stroke + gradient fill) — the
 * analytics chart treatment for the glass system.
 */
export function Sparkline({
  points,
  label,
  className,
}: {
  points: number[]
  label?: string
  className?: string
}) {
  const width = 320
  const height = 96
  const max = Math.max(...points, 1)
  const step = points.length > 1 ? width / (points.length - 1) : width
  const coords = points.map((v, i) => {
    const x = i * step
    const y = height - (v / max) * (height - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePath = `M${coords.join(' L')}`
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const gradientId = `spark-${label ?? 'chart'}-${points.length}-${max}`.replace(/[^a-zA-Z0-9-]/g, '')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? 'Trend chart'}
      className={cn('h-24 w-full', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--ember-rgb))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(var(--ember-rgb))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="rgb(var(--ember-rgb))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1].split(',')[0]}
          cy={coords[coords.length - 1].split(',')[1]}
          r="4"
          fill="rgb(var(--ember-rgb))"
        />
      )}
    </svg>
  )
}
