import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReservationQuickActions } from '@/components/dashboard/reservation-quick-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Restaurant Dashboard' }

const CONSOLE_CARD =
  'rounded-lg border border-[#4d5f7d]/20 bg-[#0B1D31] shadow-[0_4px_20px_rgba(0,0,0,0.2)]'

function statusPill(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-[#34A853]/20 text-[#7bd88f]'
    case 'rejected':
    case 'cancelled':
      return 'bg-[#BA1A1A]/25 text-[#ff8a80]'
    case 'completed':
      return 'bg-[#C2A878]/20 text-[#DFC391]'
    default:
      return 'bg-[#4d5f7d]/30 text-[#B5C7EA]'
  }
}

function displayName(email: string | null | undefined, fallback: string) {
  if (!email) return fallback
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return fallback
  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function RestaurantDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().slice(0, 10)

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: branches } = business
    ? await supabase.from('branches').select('id').eq('business_id', business.id)
    : { data: [] }
  const branchIds = (branches ?? []).map((b) => b.id)

  const [listingsRes, menuRes, upcomingRes, todayRes] = await Promise.all([
    business
      ? supabase
          .from('restaurants')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', business.id)
          .eq('is_active', true)
      : Promise.resolve({ count: 0 }),
    branchIds.length
      ? supabase.from('menu_items').select('id', { count: 'exact', head: true }).in('branch_id', branchIds)
      : Promise.resolve({ count: 0 }),
    branchIds.length
      ? supabase
          .from('reservations')
          .select('guest_count')
          .in('branch_id', branchIds)
          .gte('reservation_date', today)
          .in('status', ['pending', 'confirmed'])
          .limit(2000)
      : Promise.resolve({ data: [] }),
    branchIds.length
      ? supabase
          .from('reservations')
          .select('id, time_slot, guest_count, status, user_id')
          .in('branch_id', branchIds)
          .eq('reservation_date', today)
          .order('time_slot', { ascending: true })
          .limit(8)
      : Promise.resolve({ data: [] }),
  ])

  const upcomingCount = (upcomingRes.data ?? []).length as number
  const coversUpcoming = (upcomingRes.data ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.guest_count) || 0),
    0,
  )
  const todaysRows = (todayRes.data ?? []) as Array<{
    id: string
    time_slot: string | null
    guest_count: number
    status: string
    user_id: string | null
  }>

  // Customer contact names via owner-scoped RPC (profiles are own-row RLS).
  const userIds = Array.from(
    new Set(todaysRows.map((r) => r.user_id).filter((v): v is string => Boolean(v))),
  )
  const contactsResult = userIds.length
    ? await supabase.rpc('partner_customer_contacts', { p_user_ids: userIds })
    : { data: [] as Array<{ id: string; email: string | null }> }
  const contacts = new Map(
    ((contactsResult.data ?? []) as Array<{ id: string; email: string | null }>).map((c) => [c.id, c.email]),
  )

  const kpis = [
    { label: 'Upcoming reservations', value: String(upcomingCount), accent: true },
    { label: 'Covers upcoming', value: String(coversUpcoming), accent: false },
    { label: 'Published listings', value: String((listingsRes.count as number) ?? 0), accent: false },
    { label: 'Menu items', value: String((menuRes.count as number) ?? 0), accent: false },
  ]

  return (
    <div className="min-h-full bg-[#07192B] px-4 pb-16 pt-8 text-[#F5EFE8] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Greeting */}
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
            Partner console
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
            Good day, {business?.name ?? 'Partner'} 👋
          </h1>
        </header>

        {!business && (
          <section className="animate-pop-in rounded-xl border border-[#FBBC05]/40 bg-[#FBBC05]/10 p-4 text-sm text-[#F5EFE8]">
            No linked business profile was found for your account. Complete business signup first.
          </section>
        )}

        {/* KPI grid */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={cn(CONSOLE_CARD, 'flex h-32 flex-col justify-between p-4')}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
                {kpi.label}
              </span>
              <span
                className={cn(
                  'text-4xl font-bold tabular-nums',
                  kpi.accent ? 'text-[#DFC391]' : 'text-[#F5EFE8]',
                )}
              >
                {kpi.value}
              </span>
            </div>
          ))}
        </section>

        {/* Today's reservations timeline */}
        <section className="space-y-3">
          <h2 className="border-b border-[#4d5f7d]/25 pb-3 font-serif text-xl font-bold">
            Today&apos;s reservations
          </h2>

          {todaysRows.length > 0 ? (
            <div className="space-y-2">
              {todaysRows.map((row) => {
                const terminal = row.status === 'cancelled' || row.status === 'rejected' || row.status === 'completed'
                return (
                  <div
                    key={row.id}
                    className={cn(CONSOLE_CARD, 'flex items-center justify-between p-4', terminal && 'opacity-70')}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-12 shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7587A7] tabular-nums">
                        {row.time_slot ?? '—'}
                      </span>
                      <span className="h-10 w-px shrink-0 bg-[#4d5f7d]/30" aria-hidden />
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-semibold', terminal && 'line-through')}>
                          {displayName(contacts.get(row.user_id ?? '') ?? null, 'Guest')}
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7587A7]">
                          Party of {row.guest_count}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                          statusPill(row.status),
                        )}
                      >
                        {row.status}
                      </span>
                      <ReservationQuickActions reservationId={row.id} status={row.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
              <p className="font-semibold">No reservations for today</p>
              <p className="mt-1 text-sm text-[#7587A7]">
                Publish your listing and share your page to start filling tables.
              </p>
            </div>
          )}

          <Link
            href="/dashboard/restaurant/reservations"
            className="mt-2 block w-full rounded-full border border-[#4d5f7d]/35 bg-[#4d5f7d]/20 py-3 text-center text-sm font-semibold transition-colors hover:bg-[#4d5f7d]/35"
          >
            View all reservations
          </Link>
        </section>
      </div>
    </div>
  )
}
