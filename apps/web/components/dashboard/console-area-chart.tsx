'use client'

import { useId, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import type { ConsoleChartSeries } from '@/lib/console-types'
import { CONSOLE_CARD } from './console-tokens'

/**
 * Recharts hands `stroke` / `tick.fill` to the DOM as SVG presentation
 * *attributes*, and browsers do not substitute `var()` in those. The
 * console palette is fixed and theme-independent, so these are literal
 * values rather than `rgb(var(--console-*-rgb))` like the CSS utilities.
 */
const CHART = {
  accent: '#5B3FF0',
  grid: '#E8EAF2',
  tick: '#7A8296',
} as const

function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
  return String(value)
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string
  unit: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const value = Number(payload[0].value ?? 0)
  return (
    <div className="rounded-xl border border-console-border bg-console-card px-3 py-2 shadow-elevate">
      <p className="text-[11px] font-medium text-console-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-console-ink tabular-nums">
        {value.toLocaleString('en-US')} {unit}
      </p>
    </div>
  )
}

export function ConsoleAreaChart({
  series,
  title,
  unit,
}: {
  /** One series per dropdown option, keyed by its label. */
  series: ConsoleChartSeries
  title: string
  /** Noun shown after the number in the tooltip, e.g. "Tickets Sold". */
  unit: string
}) {
  const ranges = Object.keys(series)
  const [range, setRange] = useState<string>(ranges[0] ?? '')
  // Scoped so two charts on one page don't fight over the same <defs> id.
  const gradientId = `console-area-fill-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const points = series[range] ?? []
  const hasData = points.some((point) => point.value > 0)

  const maxValue = Math.max(...points.map((p) => p.value), 1)
  // Round the ceiling up to the next clean step so the top gridline is tidy.
  const step = maxValue <= 50 ? 10 : maxValue <= 500 ? 100 : maxValue <= 1500 ? 500 : 1000
  const domainMax = Math.ceil(maxValue / step) * step
  const ticks = Array.from({ length: domainMax / step + 1 }, (_, i) => i * step)

  return (
    <section className={CONSOLE_CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-console-border px-5 py-4">
        <h2 className="text-[15px] font-bold text-console-ink">{title}</h2>
        <div className="relative">
          <label htmlFor={`console-chart-range-${gradientId}`} className="sr-only">
            {title} date range
          </label>
          <select
            id="console-chart-range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="min-h-10 appearance-none rounded-xl border border-console-border bg-console-card py-2 pl-4 pr-9 text-[13px] font-semibold text-console-ink transition-colors duration-200 hover:bg-console-bg"
          >
            {ranges.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-console-muted"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </div>
      </div>

      {hasData ? (
        <div className="h-[260px] w-full px-2 py-4 sm:px-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART.accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke={CHART.grid}
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{ fill: CHART.tick, fontSize: 11 }}
              dy={6}
            />
            <YAxis
              domain={[0, domainMax]}
              ticks={ticks}
              axisLine={false}
              tickLine={false}
              width={44}
              tick={{ fill: CHART.tick, fontSize: 11 }}
              tickFormatter={formatCompact}
            />
            <Tooltip
              cursor={{ stroke: CHART.accent, strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<ChartTooltip unit={unit} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={CHART.accent}
              strokeWidth={2.4}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, fill: CHART.accent, strokeWidth: 0 }}
              dot={false}
              animationDuration={600}
            />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-semibold text-console-ink">No {unit.toLowerCase()} yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-console-muted">
            Once activity lands in this window it charts here automatically.
          </p>
        </div>
      )}
    </section>
  )
}