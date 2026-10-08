'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import type { ConsoleEvent, ConsoleTone } from '@/lib/console-types'
import { formatDayLong, formatThousands } from '@/lib/console-format'
import { CONSOLE_CARD } from './console-tokens'
import { cn } from '@/lib/utils'

const MONO_SPAN: Record<ConsoleTone, string> = {
  indigo: 'bg-console-indigo text-white',
  mint: 'bg-console-mint-ink text-white',
  blush: 'bg-console-blush-ink text-white',
  sand: 'bg-console-sand-ink text-white',
  sky: 'bg-console-sky-ink text-white',
}

/**
 * Cover thumbnails come from partner-supplied `cover_image_url` /
 * `cover_url` values, which `next.config.js` `remotePatterns` does not
 * whitelist and which can be missing entirely. A background-image tile
 * sidesteps the optimizer's domain allowlist and degrades to a tinted
 * initial when the URL is absent.
 */
function EventThumb({ event }: { event: ConsoleEvent }) {
  const initial = event.name.trim().charAt(0).toUpperCase() || '•'
  return (
    <span
      aria-hidden
      className={cn(
        'relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold',
        MONO_SPAN[event.tone],
      )}
      style={
        event.image
          ? { backgroundImage: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {!event.image && initial}
    </span>
  )
}

function RowMenu({
  event,
  detailHref,
  manageHref,
}: {
  event: ConsoleEvent
  /** Public listing — there is no per-event route inside the console. */
  detailHref: string
  /** The console tab that owns this row. */
  manageHref: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${event.name}`}
        className="flex size-9 items-center justify-center rounded-lg text-console-muted transition-colors hover:bg-console-bg hover:text-console-ink"
      >
        <MoreHorizontal className="size-[18px]" strokeWidth={2.2} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-console-border bg-console-card py-1 shadow-elevate"
        >
          <Link
            href={detailHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2 text-[13px] text-console-ink transition-colors hover:bg-console-bg"
          >
            View listing
          </Link>
          <Link
            href={manageHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3.5 py-2 text-[13px] text-console-ink transition-colors hover:bg-console-bg"
          >
            Manage
          </Link>
        </div>
      )}
    </div>
  )
}

export function ConsoleUpcomingList({
  events,
  title,
  viewAllHref,
  detailHrefFor,
  manageHref,
  emptyHint = 'Nothing scheduled yet.',
}: {
  events: ConsoleEvent[]
  title: string
  viewAllHref: string
  /** Per-row destination for "View listing". */
  detailHrefFor: (event: ConsoleEvent) => string
  /** Console tab that owns these rows. */
  manageHref: string
  emptyHint?: string
}) {
  return (
    <section className={CONSOLE_CARD}>
      <div className="flex items-center justify-between border-b border-console-border px-5 py-4">
        <h2 className="text-[15px] font-bold text-console-ink">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-[13px] font-semibold text-console-indigo hover:underline"
        >
          View all
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-console-muted">{emptyHint}</p>
      ) : (
        <ul className="divide-y divide-console-border">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-console-bg/70"
            >
              <EventThumb event={event} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-console-ink">{event.name}</p>
                <p className="mt-0.5 truncate text-xs text-console-muted">
                  {formatDayLong(event.date)} · {event.time}
                </p>
                <p className="mt-0.5 truncate text-xs text-console-muted">{event.venue}</p>
                <p
                  className={cn(
                    'mt-1.5 flex items-center gap-1.5 text-xs font-semibold tabular-nums',
                    event.sold > 0 ? 'text-console-green' : 'text-console-muted',
                  )}
                >
                  {event.sold > 0 && (
                    <span className="size-1.5 rounded-full bg-console-green" aria-hidden="true" />
                  )}
                  {formatThousands(event.sold)}
                  {event.capacity ? ` / ${formatThousands(event.capacity)}` : ''}{' '}
                  {event.metricLabel}
                </p>
              </div>
              <RowMenu
                event={event}
                detailHref={detailHrefFor(event)}
                manageHref={manageHref}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}