'use client'

/**
 * Recharts-rendering half of the console area chart, split out so it can be
 * code-split. recharts is ~380 KB raw; the parent component dynamically
 * imports this so that cost only lands on routes that actually draw a chart.
 *
 * Recharts hands stroke/tick.fill to the DOM as SVG presentation *attributes*,
 * and browsers do not substitute var() in those. The console palette is fixed
 * and theme-independent, so these are literal values.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

export type ChartPoint = { label: string; value: number }

export default function AreaChartCanvas({
  points,
  domainMax,
  ticks,
  gradientId,
  unit,
}: {
  points: ChartPoint[]
  domainMax: number
  ticks: number[]
  gradientId: string
  unit: string
}) {
  return (
    <div className="h-[260px] w-full px-2 py-4 sm:px-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="4 4" />
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
  )
}