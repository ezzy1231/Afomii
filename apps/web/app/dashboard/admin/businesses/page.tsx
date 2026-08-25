import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  CONSOLE_CARD,
  StatusPill,
  statusTone,
} from '@/components/dashboard/console'
import { BusinessLifecycleActions, BusinessSuspendAction } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Businesses · Admin' }

const STATUS_FILTERS = ['all', 'pending', 'active', 'inactive', 'rejected'] as const

export default async function AdminBusinessesPage({
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
    .from('businesses')
    .select('id, name, email, status, is_verified, plan, created_at')
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
    plan: string | null
    created_at: string
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Businesses"
        subtitle="Verification, suspension, and drilldown per partner."
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
            placeholder="Search businesses..."
            className="w-full bg-transparent text-sm text-[#F5EFE8] outline-none placeholder:text-[#7587A7]"
          />
          {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <a
              key={s}
              href={`/dashboard/admin/businesses?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">Business</th>
              <th scope="col" className="px-4 py-3 font-semibold">Plan</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Verified</th>
              <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No businesses match this filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className={cn('border-b border-[#4d5f7d]/10 last:border-0', row.status === 'inactive' && 'opacity-60')}>
                  <td className="max-w-[220px] px-4 py-3.5">
                    <Link href={`/dashboard/admin/businesses/${row.id}`} className="block truncate font-semibold underline-offset-2 hover:underline">
                      {row.name}
                    </Link>
                    <span className="text-xs tabular-nums text-[#7587A7]">ID: {row.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3.5 capitalize text-[#B5C7EA]">{row.plan ?? 'free'}</td>
                  <td className="px-4 py-3.5"><StatusPill status={row.status} tone={statusTone(row.status)} /></td>
                  <td className="px-4 py-3.5">{row.is_verified ? '✓' : '—'}</td>
                  <td className="px-4 py-3.5 tabular-nums text-[#B5C7EA]">
                    {new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <BusinessLifecycleActions businessId={row.id} status={row.status} />
                      <BusinessSuspendAction businessId={row.id} status={row.status} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ConsolePageShell>
  )
}
