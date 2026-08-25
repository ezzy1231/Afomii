import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  StatusPill,
} from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { UserRoleSelect, UserSuspensionActions } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Users · Admin' }

const ROLE_FILTERS = ['all', 'customer', 'food_business', 'event_organizer', 'system_admin'] as const

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; role?: string }
}) {
  const q = (searchParams?.q ?? '').trim()
  const roleFilter =
    searchParams?.role && ROLE_FILTERS.includes(searchParams.role as (typeof ROLE_FILTERS)[number])
      ? searchParams.role
      : 'all'

  const supabase = await createClient()
  const { data: { user: me } } = await supabase.auth.getUser()

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, is_suspended, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (roleFilter !== 'all') query = query.eq('role', roleFilter)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    role: string
    is_suspended: boolean | null
    created_at: string
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Users"
        subtitle="Roles, suspension, and account search. Role changes are audited."
      />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <form method="get" className={cn(CONSOLE_CARD, 'flex items-center gap-3 px-4 py-3')}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[#7587A7]">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email..."
            className="w-full bg-transparent text-sm text-[#F5EFE8] outline-none placeholder:text-[#7587A7]"
          />
          {roleFilter !== 'all' && <input type="hidden" name="role" value={roleFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((r) => (
            <a
              key={r}
              href={`/dashboard/admin/users?role=${r}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={cn(
                'min-h-[36px] whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                roleFilter === r
                  ? 'border-[#C2A878] bg-[#C2A878]/15 text-[#DFC391]'
                  : 'border-[#4d5f7d]/40 text-[#7587A7] hover:border-[#7587A7] hover:text-[#F5EFE8]'
              )}
            >
              {r}
            </a>
          ))}
        </div>
      </div>

      <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">User</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No users match this filter.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isSelf = row.id === me?.id
                return (
                  <tr key={row.id} className="border-b border-[#4d5f7d]/10 last:border-0">
                    <td className="px-4 py-3.5">
                      <span className="block truncate font-semibold">
                        {row.full_name ?? '—'}
                        {isSelf && (
                          <span className="ml-2 rounded bg-[#C2A878]/15 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-[#DFC391]">
                            You
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-[#7587A7]">{row.email ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isSelf ? (
                        <StatusPill status={row.role} tone={row.role === 'system_admin' ? 'gold' : 'info'} />
                      ) : (
                        <UserRoleSelect userId={row.id} currentRole={row.role} />
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {row.is_suspended ? (
                        <StatusPill status="suspended" tone="bad" />
                      ) : (
                        <StatusPill status="active" tone="ok" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-[#B5C7EA]">
                      {new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        {isSelf ? (
                          <span className="text-xs text-[#7587A7]">—</span>
                        ) : (
                          <UserSuspensionActions userId={row.id} isSuspended={Boolean(row.is_suspended)} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-xs text-[#7587A7]">
        Showing the latest 50 accounts{q || roleFilter !== 'all' ? ' matching your filters' : ''}.
      </p>
    </ConsolePageShell>
  )
}