import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  StatusPill,
} from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { EventModerationActions } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Events · Admin' }

const STATUS_FILTERS = ['all', 'published', 'draft', 'cancelled', 'completed'] as const

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string }
}) {
  const q = (searchParams?.q ?? '').trim()
  const statusFilter =
    searchParams?.status &&
    STATUS_FILTERS.includes(searchParams.status as (typeof STATUS_FILTERS)[number])
      ? searchParams.status
      : 'all'

  const supabase = await createClient()
  let query = supabase
    .from('events')
    .select('id, title, status, is_active, starts_at, organizers(name)')
    .order('starts_at', { ascending: true, nullsFirst: false })
    .limit(50)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: string
    title: string
    status: string
    is_active: boolean | null
    starts_at: string | null
    organizers: { name: string }[] | { name: string } | null
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Events"
        subtitle="Moderate what appears on the public events catalogue."
      />

      <div className="flex flex-col gap-3">
        <form method="get" className={cn(CONSOLE_CARD, 'flex items-center gap-3 px-4 py-3')}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[#7587A7]">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search events..."
            className="w-full bg-transparent text-sm text-[#F5EFE8] outline-none placeholder:text-[#7587A7]"
          />
          {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <a
              key={s}
              href={`/dashboard/admin/events?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={cn(
                'min-h-[36px] whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                statusFilter === s
                  ? 'border-[#C2A878] bg-[#C2A878]/15 text-[#DFC391]'
                  : 'border-[#4d5f7d]/40 text-[#7587A7] hover:border-[#7587A7] hover:text-[#F5EFE8]'
              )}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">Event</th>
              <th scope="col" className="px-4 py-3 font-semibold">Organizer</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Moderate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No events match this filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const organizerName = Array.isArray(row.organizers)
                  ? row.organizers[0]?.name ?? '—'
                  : row.organizers?.name ?? '—'
                return (
                  <tr key={row.id} className="border-b border-[#4d5f7d]/10 last:border-0">
                    <td className="max-w-[240px] truncate px-4 py-3.5"><Link href={`/dashboard/admin/events/${row.id}`} className="font-semibold underline-offset-2 hover:underline">{row.title}</Link></td>
                    <td className="max-w-[160px] truncate px-4 py-3.5 text-[#B5C7EA]">{organizerName}</td>
                    <td className="px-4 py-3.5 tabular-nums text-[#B5C7EA]">{formatDate(row.starts_at)}</td>
                    <td className="px-4 py-3.5"><StatusPill status={row.status} tone={statusTone(row.status)} /></td>
                    <td className="px-4 py-3.5">
                      <EventModerationActions eventId={row.id} status={row.status} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </ConsolePageShell>
  )
}