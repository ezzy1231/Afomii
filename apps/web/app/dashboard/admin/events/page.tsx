import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  CONSOLE_CARD,
  StatusPill,
  statusTone,
} from '@/components/dashboard/console'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Events · Admin' }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id, title, status, is_active, starts_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (data ?? []) as Array<{
    id: string
    title: string
    status: string
    is_active: boolean | null
    starts_at: string | null
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader eyebrow="Admin console" title="Events" subtitle="Published listings across all organizers." />
      <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">Event</th>
              <th scope="col" className="px-4 py-3 font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Live</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No events published yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[#4d5f7d]/10 last:border-0">
                  <td className="max-w-[240px] truncate px-4 py-3.5 font-semibold">{row.title}</td>
                  <td className="px-4 py-3.5 tabular-nums text-[#B5C7EA]">{formatDate(row.starts_at)}</td>
                  <td className="px-4 py-3.5"><StatusPill status={row.status} tone={statusTone(row.status)} /></td>
                  <td className="px-4 py-3.5 text-[#B5C7EA]">{row.is_active ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ConsolePageShell>
  )
}
