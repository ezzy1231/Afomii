'use client'

import { useId, useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown } from 'lucide-react'
import type { ConsoleChartSeries } from '@/lib/console-types'
import { CONSOLE_CARD } from './console-tokens'

/* recharts is ~380 KB raw. The card chrome, the range select and the empty
   state stay in this eagerly-loaded component; only the chart drawing is
   code-split, so routes with a chart pay for it lazily and the rest don't
   ship it at all. */
const AreaChartCanvas = dynamic(() => import('./console-area-chart-impl'), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full animate-pulse rounded-xl bg-console-bg px-2 py-4 sm:px-4" />
  ),
})

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
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const gradientId = `console-area-fill-${instanceId}`
  const rangeSelectId = `console-chart-range-${instanceId}`

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
          <label htmlFor={rangeSelectId} className="sr-only">
            {title} date range
          </label>
          <select
            id={rangeSelectId}
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
        <AreaChartCanvas
          points={points}
          domainMax={domainMax}
          ticks={ticks}
          gradientId={gradientId}
          unit={unit}
        />
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