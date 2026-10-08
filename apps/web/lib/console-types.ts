/**
 * Prop contracts for the partner console (organizer + restaurant dashboards).
 *
 * Deliberately free of any fixture or transport concern: the server data
 * layer in `lib/dashboard/*` maps Postgres rows onto these shapes, so the
 * console components never learn about `events` / `reservations` / `branches`.
 */

export type ConsoleTone = 'indigo' | 'mint' | 'blush' | 'sand' | 'sky'

export type ConsoleEvent = {
  id: string
  name: string
  /** Local calendar date, `YYYY-MM-DD`. Never a UTC-shifted `Date`. */
  date: string
  /** Pre-formatted clock time, e.g. `7:00 PM`. */
  time: string
  venue: string
  /** Always rendered in green next to a dot; the "positive" number. */
  sold: number
  /** Optional — reservations have no capacity to compare against. */
  capacity?: number
  /** Unit that follows the number, e.g. `sold` or `guests`. */
  metricLabel: string
  tone: ConsoleTone
  /** Remote cover URL. `null` renders a tinted initial tile instead. */
  image: string | null
}

export type ConsoleStat = {
  label: string
  value: string
  subtext: string
  icon: 'calendar' | 'ticket' | 'revenue' | 'attendees'
  tone: ConsoleTone
}

export type ConsoleChartPoint = {
  /** Axis + tooltip label, e.g. `12 Jun`. Produced by the data layer. */
  label: string
  value: number
}

/** One series per selectable range, keyed by the dropdown option label. */
export type ConsoleChartSeries = Record<string, ConsoleChartPoint[]>