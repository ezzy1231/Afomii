'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Shared dark-console primitives for partner/admin surfaces.
 * Palette follows the shipped console screens (#07192B shell, #0B1D31 cards,
 * #7587A7 muted, #DFC391 gold accent) so every dashboard screen matches.
 */

export const CONSOLE_CARD =
  'rounded-lg border border-[#4d5f7d]/20 bg-[#0B1D31] shadow-[0_4px_20px_rgba(0,0,0,0.2)]'

export function ConsolePageShell({
  children,
  maxWidth = 'max-w-5xl',
}: {
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <div className="min-h-full bg-[#07192B] px-4 pb-16 pt-8 text-[#F5EFE8] sm:px-6 lg:px-8">
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-[#B5C7EA]">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-[#4d5f7d]/25 pb-3 font-serif text-xl font-bold">{children}</h2>
  )
}

export function StatusPill({ status, tone }: { status: string; tone?: 'ok' | 'bad' | 'gold' | 'info' }) {
  const toneCls =
    tone === 'ok'
      ? 'bg-[#34A853]/20 text-[#7bd88f]'
      : tone === 'bad'
        ? 'bg-[#BA1A1A]/25 text-[#ff8a80]'
        : tone === 'gold'
          ? 'bg-[#C2A878]/20 text-[#DFC391]'
          : 'bg-[#4d5f7d]/30 text-[#B5C7EA]'
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

export function statusTone(status: string): 'ok' | 'bad' | 'gold' | 'info' {
  switch (status) {
    case 'confirmed':
    case 'active':
    case 'paid':
      return 'ok'
    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'failed':
      return 'bad'
    case 'completed':
      return 'gold'
    default:
      return 'info'
  }
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
    <div className={cn(CONSOLE_CARD, 'flex min-h-32 flex-col justify-between p-4')}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
        {label}
      </span>
      <div>
        <span
          className={cn(
            'block text-4xl font-bold tabular-nums',
            accent ? 'text-[#DFC391]' : 'text-[#F5EFE8]'
          )}
        >
          {value}
        </span>
        {trend && trend.direction !== 'flat' && (
          <span
            className={cn(
              'mt-1 block text-xs font-semibold tabular-nums',
              trend.direction === 'up' ? 'text-[#7bd88f]' : 'text-[#ff8a80]'
            )}
          >
            {trend.direction === 'up' ? '▲' : '▼'} {trend.text}
          </span>
        )}
        {trend && trend.direction === 'flat' && (
          <span className="mt-1 block text-xs font-medium text-[#7587A7]">{trend.text}</span>
        )}
      </div>
    </div>
  )
}

/** Underline-style segmented control from the reservations screen. */
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
    <div className="flex rounded-lg border border-[#4d5f7d]/30 bg-[#0B1D31] p-1" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'min-h-9 flex-1 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors',
            value === opt.value
              ? 'bg-[#C2A878] text-navy'
              : 'text-[#7587A7] hover:text-[#F5EFE8]'
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
        'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-[#C2A878] bg-[#C2A878]/15 text-[#DFC391]'
          : 'border-[#4d5f7d]/40 text-[#7587A7] hover:border-[#7587A7] hover:text-[#F5EFE8]'
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
        'relative -m-2.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0 transition-colors',
        checked ? 'bg-[#34A853]' : 'bg-[#4d5f7d]/40'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-[#F5EFE8] shadow transition-transform',
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
        <div key={i} className={cn(height, 'animate-pulse rounded-lg bg-[#0B1D31]')} />
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
    <div className="flex w-fit rounded-lg border border-[#4d5f7d]/30 bg-[#0B1D31] p-1" role="tablist" aria-label="Date range">
      {options.map((range) => (
        <Link
          key={range}
          href={`?range=${range}`}
          scroll={false}
          role="tab"
          aria-selected={current === range}
          className={cn(
            'min-h-9 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
            current === range
              ? 'bg-[#C2A878] text-navy'
              : 'text-[#7587A7] hover:text-[#F5EFE8]'
          )}
        >
          {range}
        </Link>
      ))}
    </div>
  )
}

/**
 * Dependency-free SVG area-line (gold stroke + gradient fill) matching the
 * Stitch analytics artboard's chart treatment.
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
          <stop offset="0%" stopColor="#C2A878" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#C2A878" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke="#DFC391" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1].split(',')[0]}
          cy={coords[coords.length - 1].split(',')[1]}
          r="4"
          fill="#DFC391"
        />
      )}
    </svg>
  )
}
