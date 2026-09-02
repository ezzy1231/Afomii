import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReservationQuickActions } from '@/components/dashboard/reservation-quick-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Restaurant Dashboard' }

const CONSOLE_CARD = 'glass rounded-2xl'

function statusPill(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-success/20 text-success'
    case 'rejected':
    case 'cancelled':
      return 'bg-danger/15 text-danger'
    case 'completed':
      return 'bg-ember/20 text-ember'
    default:
      return 'bg-app-elevated/80 text-app-muted'
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

  const { data: businessRaw } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  // Self-heal pre-provisioning accounts on first view.
  let business = businessRaw
  if (!business && user) {
    const metaRole = (user.user_metadata as Record<string, unknown> | undefined)?.role
    if (metaRole === 'food_business') {
      const { ensureBusiness } = await import('@/lib/provision')
      business = await ensureBusiness(supabase, user)
    }
  }

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
    <div className="min-h-full px-4 pb-16 pt-8 text-app-fg sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Greeting */}
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
            Partner console
          </p>
          <h1 className="mt-2  text-3xl font-bold sm:text-4xl">
            Good day, {business?.name ?? 'Partner'} 👋
          </h1>
        </header>

        {!business && (
          <section className="animate-pop-in rounded-xl border border-[#FBBC05]/40 bg-[#FBBC05]/10 p-4 text-sm text-app-fg">
            No linked business profile was found for your account. Complete business signup first.
          </section>
        )}

        {business && (listingsRes.count ?? 0) === 0 && (
          <section className={cn(CONSOLE_CARD, 'animate-pop-in border-dashed p-8 text-center')}>
            <p className="font-semibold">No published listings yet</p>
            <p className="mt-1 text-sm text-app-muted">
              Create your first listing so diners can find and book you.
            </p>
            <Link
              href="/dashboard/restaurant/listings/new"
              className="mt-4 inline-block min-h-[44px] rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition-all hover:brightness-110"
            >
              Create your first listing
            </Link>
          </section>
        )}

        {/* KPI grid */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={cn(CONSOLE_CARD, 'flex h-32 flex-col justify-between p-4')}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
                {kpi.label}
              </span>
              <span
                className={cn(
                  'text-4xl font-bold tabular-nums',
                  kpi.accent ? 'text-ember' : 'text-app-fg',
                )}
              >
                {kpi.value}
              </span>
            </div>
          ))}
        </section>

        {/* Today's reservations timeline */}
        <section className="space-y-3">
          <h2 className="border-b border-app-border pb-3  text-xl font-bold">
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
                      <span className="w-12 shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-app-muted tabular-nums">
                        {row.time_slot ?? '—'}
                      </span>
                      <span className="h-10 w-px shrink-0 bg-app-elevated/80" aria-hidden />
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-semibold', terminal && 'line-through')}>
                          {displayName(contacts.get(row.user_id ?? '') ?? null, 'Guest')}
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-app-muted">
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
              <p className="mt-1 text-sm text-app-muted">
                Publish your listing and share your page to start filling tables.
              </p>
            </div>
          )}

          <Link
            href="/dashboard/restaurant/reservations"
            className="mt-2 block w-full rounded-full border border-app-border bg-app-input/70 py-3 text-center text-sm font-semibold transition-colors hover:bg-app-elevated"
          >
            View all reservations
          </Link>
        </section>
      </div>
    </div>
  )
}
