import type { ConsoleTone } from '@/lib/console-types'

/**
 * Shared formatters for the partner console.
 *
 * Two rules hold everywhere below:
 *  1. Never `new Date('2026-06-12')` — that parses as UTC and renders the
 *     previous day for anyone west of Greenwich. Slice the ISO string.
 *  2. Keep these deterministic. They run on the server during render and
 *     again on the client during hydration; anything locale- or
 *     timezone-dependent would mismatch.
 */

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function pad2(value: number) {
  return String(value).padStart(2, '0')
}

/** `YYYY-MM-DD` for a local Date. */
export function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Parse `YYYY-MM-DD` into local parts without touching the clock. */
export function fromDayKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

/** `Jun 12` — the calendar's day-axis / tooltip label. */
export function formatDayLabel(key: string) {
  const { month, day } = fromDayKey(key)
  return `${MONTHS_SHORT[month - 1]} ${day}`
}

/** `Jun 12, 2026` — list rows, where the year matters. */
export function formatDayLong(key: string) {
  const { year, month, day } = fromDayKey(key)
  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`
}

export function formatMonthYear(year: number, monthIndex: number) {
  return `${MONTHS_LONG[monthIndex]} ${year}`
}

/** Monday-first index for a JS `Date` (Sunday = 0 maps to 6). */
export function mondayFirstIndex(date: Date) {
  return (date.getDay() + 6) % 7
}

/**
 * `7:00 PM` from a `timestamptz`. This one *does* read the instant, because
 * the stored value is absolute and the reader wants their own wall clock.
 * Only ever called after hydration or in a server-only path.
 */
export function formatClockTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const hours = date.getHours()
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const twelve = hours % 12 === 0 ? 12 : hours % 12
  return `${twelve}:${pad2(date.getMinutes())} ${suffix}`
}

/** Local `YYYY-MM-DD` of an instant, for bucketing into the calendar. */
export function dayKeyOfInstant(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return toDayKey(date)
}

const TONE_CYCLE: ConsoleTone[] = ['indigo', 'mint', 'blush', 'sand', 'sky']

/**
 * Stable pastel per row. Hashing the id keeps an event the same colour
 * across renders, which a per-render counter would not.
 */
export function toneFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return TONE_CYCLE[hash % TONE_CYCLE.length]
}

export function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`
  return String(value)
}

export function formatThousands(value: number) {
  return value.toLocaleString('en-US')
}

/** `ETB 12,400` — the app's transaction currency, per `ticket_purchases.currency`. */
export function formatETB(value: number) {
  return `ETB ${value.toLocaleString('en-US')}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : plural}`
}