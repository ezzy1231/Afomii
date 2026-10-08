'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { ConsoleEvent } from '@/lib/console-types'
import {
  formatMonthYear,
  formatThousands,
  fromDayKey,
  mondayFirstIndex,
  toDayKey,
  WEEKDAY_LABELS,
} from '@/lib/console-format'
import { CONSOLE_CARD, TONE_INK, TONE_SURFACE } from './console-tokens'
import { cn } from '@/lib/utils'

const MAX_CHIPS = 2

type CalendarCell = {
  key: string
  day: number
  inMonth: boolean
  events: ConsoleEvent[]
}

function buildMonthGrid(year: number, month: number, events: ConsoleEvent[]) {
  const byDate = new Map<string, ConsoleEvent[]>()
  for (const event of events) {
    if (!event.date) continue
    const bucket = byDate.get(event.date)
    if (bucket) bucket.push(event)
    else byDate.set(event.date, [event])
  }

  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const lead = mondayFirstIndex(firstOfMonth)
  const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7

  const cells: CalendarCell[] = []
  for (let i = 0; i < cellCount; i += 1) {
    const date = new Date(year, month, 1 - lead + i)
    const key = toDayKey(date)
    cells.push({
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      events: (byDate.get(key) ?? []).sort((a, b) => a.time.localeCompare(b.time)),
    })
  }
  return cells
}

function weekLabel(cells: CalendarCell[]) {
  const first = cells[0]?.key
  const last = cells[cells.length - 1]?.key
  if (!first || !last) return ''
  const a = fromDayKey(first)
  const b = fromDayKey(last)
  const short = WEEKDAY_LABEL_MONTHS
  if (a.month === b.month) return `${short[a.month - 1]} ${a.day} – ${b.day}, ${b.year}`
  return `${short[a.month - 1]} ${a.day} – ${short[b.month - 1]} ${b.day}, ${b.year}`
}

const WEEKDAY_LABEL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month + delta, 1)
  return { year: next.getFullYear(), month: next.getMonth() }
}

function EventChip({ event }: { event: ConsoleEvent }) {
  return (
    <li
      title={`${event.name} · ${event.time} · ${event.sold}${event.capacity ? ` / ${event.capacity}` : ''} ${event.metricLabel}`}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] leading-tight',
        TONE_SURFACE[event.tone],
      )}
    >
      <span className="min-w-0 flex-1 truncate font-semibold text-console-ink">{event.name}</span>
      <span className="hidden shrink-0 items-center gap-1 text-[10px] text-console-muted xl:flex">
        {event.time}
        {event.sold > 0 && <span className="size-1.5 rounded-full bg-console-green" aria-hidden="true" />}
        <span className="tabular-nums">
          {formatThousands(event.sold)}
          {event.capacity ? ` / ${formatThousands(event.capacity)}` : ''}
        </span>
      </span>
    </li>
  )
}

export function ConsoleEventCalendar({
  events,
  createHref,
  createLabel = 'Create Event',
}: {
  events: ConsoleEvent[]
  createHref: string
  createLabel?: string
}) {
  // Open on the month that actually contains the next event, so the grid is
  // never a wall of empty cells for a dashboard with real dates.
  const initial = useMemo(() => {
    const now = new Date()
    const upcoming = events
      .filter((event) => event.date >= toDayKey(now))
      .sort((a, b) => a.date.localeCompare(b.date))[0]
    const anchor = upcoming?.date ? fromDayKey(upcoming.date) : null
    return anchor
      ? { year: anchor.year, month: anchor.month - 1 }
      : { year: now.getFullYear(), month: now.getMonth() }
    // Only the first render should pick an anchor; later navigation is state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [cursor, setCursor] = useState(initial)
  const [view, setView] = useState<'month' | 'week'>('month')

  const monthCells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, events),
    [cursor, events],
  )
  const weekCells = useMemo(() => {
    const lead = mondayFirstIndex(new Date(cursor.year, cursor.month, 1))
    return monthCells.slice(lead, lead + 7)
  }, [cursor, monthCells])

  const visible = view === 'month' ? monthCells : weekCells
  const todayKey = toDayKey(new Date())

  function step(direction: number) {
    setCursor((prev) =>
      view === 'month'
        ? shiftMonth(prev.year, prev.month, direction)
        : (() => {
            const base = new Date(prev.year, prev.month, 1)
            base.setDate(base.getDate() + direction * 7)
            return { year: base.getFullYear(), month: base.getMonth() }
          })(),
    )
  }

  return (
    <section className={cn(CONSOLE_CARD, 'overflow-hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-console-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Calendar view"
            className="flex rounded-xl bg-console-bg p-1"
          >
            {(['month', 'week'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  'min-h-9 rounded-lg px-3.5 text-[13px] font-semibold capitalize transition-colors duration-200',
                  view === option
                    ? 'bg-console-card text-console-ink shadow-soft'
                    : 'text-console-muted hover:text-console-ink',
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={view === 'month' ? 'Previous month' : 'Previous week'}
              className="flex size-9 items-center justify-center rounded-lg text-console-muted transition-colors hover:bg-console-bg hover:text-console-ink"
            >
              <ChevronLeft className="size-[18px]" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={view === 'month' ? 'Next month' : 'Next week'}
              className="flex size-9 items-center justify-center rounded-lg text-console-muted transition-colors hover:bg-console-bg hover:text-console-ink"
            >
              <ChevronRight className="size-[18px]" strokeWidth={2.2} />
            </button>
            <p className="ml-1 min-w-[124px] text-[15px] font-bold text-console-ink">
              {view === 'month' ? formatMonthYear(cursor.year, cursor.month) : weekLabel(visible)}
            </p>
          </div>
        </div>

        <Link
          href={createHref}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-console-indigo px-4 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgb(91_63_240/0.26)] transition-colors duration-200 hover:bg-console-indigo-deep"
        >
          <Plus className="size-4" strokeWidth={2.6} />
          {createLabel}
        </Link>
      </div>

      <div className="px-3 pb-4 pt-3 sm:px-4 sm:pb-5">
        <div role="grid" aria-label="Event calendar">
          <div role="row" className="grid grid-cols-7 gap-1 pb-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                role="columnheader"
                className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-console-muted"
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden" aria-hidden="true">
                  {label[0]}
                </span>
              </div>
            ))}
          </div>

          <div role="rowgroup" className="grid grid-cols-7 gap-1">
            {visible.map((cell) => {
              const isToday = cell.key === todayKey
              const overflow = cell.events.length - MAX_CHIPS
              return (
                <div
                  key={cell.key}
                  role="gridcell"
                  aria-label={`${cell.key}${cell.events.length ? `. ${cell.events.length} events` : ''}`}
                  className={cn(
                    'flex min-h-[104px] flex-col gap-1 rounded-xl border p-1.5 transition-colors sm:min-h-[124px] sm:p-2',
                    cell.inMonth || view === 'week'
                      ? 'border-console-border bg-console-card'
                      : 'border-transparent bg-console-bg/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center self-end rounded-full text-[12px] font-semibold tabular-nums',
                      isToday
                        ? 'bg-console-indigo text-white'
                        : cell.inMonth || view === 'week'
                          ? 'text-console-ink'
                          : 'text-console-muted/50',
                    )}
                  >
                    {cell.day}
                  </span>

                  <ul className="flex min-w-0 flex-col gap-1">
                    {cell.events.slice(0, MAX_CHIPS).map((event) => (
                      <EventChip key={event.id} event={event} />
                    ))}
                  </ul>

                  {overflow > 0 && (
                    <p className={cn('text-[10px] font-semibold', TONE_INK.indigo)}>+{overflow} more</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}