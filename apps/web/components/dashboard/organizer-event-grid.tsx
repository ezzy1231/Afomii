'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Ticket } from 'lucide-react'
import { toggleEventActive } from '@/app/dashboard/actions'
import type { OrganizerEventRecord } from '@/lib/dashboard/organizer-data'
import { formatDayLong, formatThousands } from '@/lib/console-format'
import { CONSOLE_CARD } from './console-tokens'
import { cn } from '@/lib/utils'

/**
 * Publish/unpublish grid for `/dashboard/organizer/events`.
 *
 * The list arrives as a server-rendered prop; only the toggle is client
 * state. That replaces the previous all-client page, which fetched its own
 * auth and data and read `profile.id` where it meant `profileRow.id`.
 */
export function OrganizerEventGrid({ events }: { events: OrganizerEventRecord[] }) {
  const [rows, setRows] = useState(events)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle(event: OrganizerEventRecord) {
    const next = !event.isActive
    setRows((prev) => prev.map((row) => (row.id === event.id ? { ...row, isActive: next } : row)))
    setError(null)
    startTransition(async () => {
      const result = await toggleEventActive(event.id, next)
      if (result.ok) return
      // Roll back the optimistic flip — the server refused.
      setRows((prev) =>
        prev.map((row) => (row.id === event.id ? { ...row, isActive: event.isActive } : row)),
      )
      setError(result.message)
    })
  }

  return (
    <>
      {error && (
        <p role="alert" className="rounded-xl border border-[#F5C2BC] bg-[#FDECEA] px-4 py-3 text-sm text-[#8C1D18]">
          {error}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((event) => (
          <li key={event.id} className={cn(CONSOLE_CARD, 'flex flex-col p-5')}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-sm font-bold text-console-ink">{event.title}</h3>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                  event.isActive
                    ? 'bg-console-mint text-console-mint-ink'
                    : 'bg-console-bg text-console-muted',
                )}
              >
                {event.isActive ? 'Published' : 'Draft'}
              </span>
            </div>

            {event.category && (
              <p className="mt-1 truncate text-xs text-console-muted">{event.category}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-console-muted">
              {event.venueName && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{event.venueName}</span>
                </span>
              )}
              {event.startsAt && (
                <span className="flex shrink-0 items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                  {formatDayLong(event.startsAt.slice(0, 10))}
                </span>
              )}
            </div>

            <p
              className={cn(
                'mt-3 flex items-center gap-1.5 text-xs font-semibold tabular-nums',
                event.sold > 0 ? 'text-console-green' : 'text-console-muted',
              )}
            >
              <Ticket className="size-3.5 shrink-0" aria-hidden="true" />
              {event.capacity > 0
                ? `${formatThousands(event.sold)} / ${formatThousands(event.capacity)} sold`
                : 'No ticket tier yet'}
            </p>

            <div className="mt-4 flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => toggle(event)}
                disabled={pending}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-console-border px-3.5 text-[13px] font-semibold text-console-ink transition-colors hover:bg-console-bg disabled:opacity-50"
              >
                {event.isActive ? 'Unpublish' : 'Publish'}
              </button>
              <Link
                href={`/events/${event.id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 text-[13px] font-semibold text-console-indigo transition-colors hover:bg-console-bg"
              >
                View listing
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}