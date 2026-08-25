import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  StatusPill,
} from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { ReservationCancelAction } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Reservations · Admin' }

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'] as const

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams?: { status?: string }
}) {
  const statusFilter =
    searchParams?.status &&
    STATUS_FILTERS.includes(searchParams.status as (typeof STATUS_FILTERS)[number])
      ? searchParams.status
      : 'all'

  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select(
      `id, status, reservation_date, time_slot, guest_count, user_id,
       branches(branch_name, businesses(name))`
    )
    .order('reservation_date', { ascending: false })
    .limit(50)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)

  const { data } = await query
  const rows = (data ?? []) as unknown as Array<{
    id: string
    status: string
    reservation_date: string
    time_slot: string | null
    guest_count: number | null
    user_id: string | null
    branches: { branch_name: string | null; businesses: { name: string }[] | { name: string } | null }[] | null
  }>

  // Guest contact names via the owner/admin-scoped RPC.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter((v): v is string => Boolean(v))))
  const contactsRes = userIds.length
    ? await supabase.rpc('partner_customer_contacts', { p_user_ids: userIds })
    : { data: [] }
  const contacts = new Map(
    ((contactsRes.data ?? []) as Array<{ id: string; email: string | null }>).map((c) => [c.id, c.email]),
  )

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Reservations"
        subtitle="Platform-wide booking oversight. Cancelling is audited."
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <a
            key={s}
            href={`/dashboard/admin/reservations?status=${s}`}
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

      <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">Guest</th>
              <th scope="col" className="px-4 py-3 font-semibold">Venue</th>
              <th scope="col" className="px-4 py-3 font-semibold">When</th>
              <th scope="col" className="px-4 py-3 font-semibold">Party</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No reservations match this filter yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const branch = row.branches?.[0] ?? null
                const businessName = branch?.businesses
                  ? Array.isArray(branch.businesses)
                    ? branch.businesses[0]?.name ?? ''
                    : branch.businesses.name
                  : ''
                return (
                  <tr key={row.id} className={cn('border-b border-[#4d5f7d]/10 last:border-0', (row.status === 'cancelled' || row.status === 'rejected') && 'opacity-60')}>
                    <td className="max-w-[180px] truncate px-4 py-3.5 font-semibold">
                      {contacts.get(row.user_id ?? '') ?? 'Guest'}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3.5 text-[#B5C7EA]">
                      {[businessName, branch?.branch_name].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-[#B5C7EA]">
                      {new Date(`${row.reservation_date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      {row.time_slot ? ` · ${row.time_slot}` : ''}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">{row.guest_count ?? '—'}</td>
                    <td className="px-4 py-3.5"><StatusPill status={row.status} tone={statusTone(row.status)} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <ReservationCancelAction reservationId={row.id} status={row.status} />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-xs text-[#7587A7]">Showing the latest 50 reservations matching your filter.</p>
    </ConsolePageShell>
  )
}