import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  StatusPill,
} from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { OrganizerVerificationActions } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Organizers · Admin' }

const STATUS_FILTERS = ['all', 'pending', 'active', 'rejected', 'inactive'] as const

export default async function AdminOrganizersPage({
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
    .from('organizers')
    .select('id, name, email, status, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: string
    name: string
    email: string | null
    status: string
    is_verified: boolean | null
    created_at: string
  }>

  const pendingCount = rows.filter((r) => r.status === 'pending').length

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Organizers"
        subtitle="Verify event organizers before their profiles go public."
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
            placeholder="Search organizers..."
            className="w-full bg-transparent text-sm text-[#F5EFE8] outline-none placeholder:text-[#7587A7]"
          />
          {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <a
              key={s}
              href={`/dashboard/admin/organizers?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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

      <section className="space-y-3">
        {pendingCount > 0 && (
          <span className="inline-block rounded-full bg-[#FBBC05]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FBBC05]">
            {pendingCount} pending in view
          </span>
        )}

        {rows.length === 0 ? (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-10 text-center')}>
            <p className="font-semibold">No organizers match this filter</p>
            <p className="mt-1 text-sm text-[#7587A7]">New organizer signups will queue here for review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className={cn(CONSOLE_CARD, 'flex flex-wrap items-center justify-between gap-3 p-4')}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#7587A7]">
                    {row.email ?? 'No public email'} · joined{' '}
                    {new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill status={row.status} tone={statusTone(row.status)} />
                  <OrganizerVerificationActions organizerId={row.id} status={row.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ConsolePageShell>
  )
}