import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  FilterChip,
  StatusPill,
} from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { OrganizerVerificationActions } from '@/components/dashboard/admin-actions'
import { AdminTable } from '@/components/dashboard/admin-table'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Organizers · Admin' }

const STATUS_FILTERS = ['all', 'pending', 'active', 'rejected', 'inactive'] as const

export default async function AdminOrganizersPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; sort?: string; direction?: string; page?: string }
}) {
  const q = (searchParams?.q ?? '').trim()
  const statusFilter =
    searchParams?.status &&
    STATUS_FILTERS.includes(searchParams.status as (typeof STATUS_FILTERS)[number])
      ? searchParams.status
      : 'all'
  const allowedSorts = ['name', 'email', 'status', 'created_at'] as const
  const sort = allowedSorts.includes(searchParams?.sort as (typeof allowedSorts)[number]) ? searchParams?.sort as (typeof allowedSorts)[number] : 'created_at'
  const direction = searchParams?.direction === 'asc' ? 'asc' : 'desc'
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? '1', 10) || 1)

  const supabase = await createClient()
  let query = supabase
    .from('organizers')
    .select('id, name, email, status, is_verified, created_at', { count: 'exact' })
    .order(sort, { ascending: direction === 'asc' })
    .range((page - 1) * 50, page * 50 - 1)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error, count } = await query
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
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-app-muted">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search organizers..."
            className="w-full bg-transparent text-sm text-app-fg outline-none placeholder:text-app-muted"
          />
          {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <FilterChip
              key={s}
              href={`/dashboard/admin/organizers?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              active={statusFilter === s}
            >
              {s}
            </FilterChip>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        {pendingCount > 0 && (
          <span className="inline-block rounded-full bg-ember/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ember">
            {pendingCount} pending in view
          </span>
        )}

        <AdminTable
          caption="Organizers"
          basePath="/dashboard/admin/organizers"
          query={{ q, status: statusFilter === 'all' ? undefined : statusFilter, sort, direction }}
          sort={sort}
          direction={direction}
          page={page}
          total={count ?? 0}
          error={Boolean(error)}
          emptyText="No organizers match this filter."
          columns={[{ key: 'name', label: 'Organizer', sortable: true }, { key: 'email', label: 'Email', sortable: true }, { key: 'status', label: 'Status', sortable: true }, { key: 'created_at', label: 'Joined', sortable: true }, { key: 'actions', label: 'Actions', align: 'right' }]}
          rows={rows.map((row) => ({ key: row.id, cells: [
            <Link key="organizer" href={`/dashboard/admin/organizers/${row.id}`} className="font-semibold underline-offset-2 hover:underline">{row.name}</Link>,
            <span key="email" className="text-app-muted">{row.email ?? 'No public email'}</span>,
            <StatusPill key="status" status={row.status} tone={statusTone(row.status)} />,
            <span key="joined" className="whitespace-nowrap tabular-nums text-app-muted">{new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
            <OrganizerVerificationActions key="actions" organizerId={row.id} status={row.status} />,
          ] }))}
        />
      </section>
    </ConsolePageShell>
  )
}
