import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getRestaurantDashboard,
  reservationIsTerminal,
} from '@/lib/dashboard/restaurant-data'
import { ReservationQuickActions } from '@/components/dashboard/reservation-quick-actions'
import { ConsoleStatRow } from '@/components/dashboard/console-primitives'
import { ConsoleEventCalendar } from '@/components/dashboard/console-event-calendar'
import { ConsoleAreaChart } from '@/components/dashboard/console-area-chart'
import { ConsoleUpcomingList } from '@/components/dashboard/console-upcoming-list'
import { CONSOLE_CARD } from '@/components/dashboard/console-tokens'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Restaurant Dashboard' }

function statusPill(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-console-mint text-console-mint-ink'
    case 'rejected':
    case 'cancelled':
      return 'bg-console-blush text-console-blush-ink'
    case 'completed':
      return 'bg-console-sky text-console-sky-ink'
    default:
      return 'bg-console-sand text-console-sand-ink'
  }
}

function displayName(email: string | null | undefined, fallback: string) {
  if (!email) return fallback
  const cleaned = email
    .split('@')[0]
    ?.replace(/[._-]+/g, ' ')
    .trim()
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
  if (!user) redirect('/auth/signin?next=/dashboard/restaurant')

  const data = await getRestaurantDashboard(supabase, user)

  return (
    <div className="space-y-6">
      {!data.business ? (
        <section className={`${CONSOLE_CARD} border-dashed p-10 text-center`}>
          <p className="font-semibold text-console-ink">No linked business profile</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-console-muted">
            Your account is not connected to a restaurant, so reservations cannot be shown. Complete
            business signup to continue.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-console-indigo px-5 text-sm font-semibold text-white transition-colors hover:bg-console-indigo-deep"
          >
            Account settings
          </Link>
        </section>
      ) : (
        <>
          {!data.listingsCount && (
            <section
              className={cn(
                CONSOLE_CARD,
                'flex flex-wrap items-center justify-between gap-4 border-dashed p-6',
              )}
            >
              <div>
                <p className="font-semibold text-console-ink">No published listings yet</p>
                <p className="mt-1 text-sm text-console-muted">
                  Create your first listing so diners can find and book you.
                </p>
              </div>
              <Link
                href="/dashboard/restaurant/listings/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-console-indigo px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgb(91_63_240/0.28)] transition-colors hover:bg-console-indigo-deep"
              >
                Create your first listing
              </Link>
            </section>
          )}

          <ConsoleStatRow stats={data.stats} />

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="min-w-0 space-y-6">
              <ConsoleEventCalendar
                events={data.calendar}
                createHref="/dashboard/restaurant/reservations"
                createLabel="Add Reservation"
              />

              <section className={CONSOLE_CARD}>
                <div className="border-b border-console-border px-5 py-4">
                  <h2 className="text-[15px] font-bold text-console-ink">
                    Today&apos;s reservations
                  </h2>
                </div>

                {data.today.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-console-muted">
                    No reservations for today. Publish your listing and share your page to start
                    filling tables.
                  </p>
                ) : (
                  <ul className="divide-y divide-console-border">
                    {data.today.map((row) => {
                      const terminal = reservationIsTerminal(row.status)
                      const guest = row.userId
                        ? displayName(data.contacts.get(row.userId), 'Guest')
                        : 'Guest'
                      return (
                        <li
                          key={row.id}
                          className={cn(
                            'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-console-bg/70',
                            terminal && 'opacity-70',
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="w-14 shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-console-muted tabular-nums">
                              {row.timeSlot ?? '—'}
                            </span>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  'truncate text-sm font-semibold text-console-ink',
                                  terminal && 'line-through',
                                )}
                              >
                                {guest}
                              </p>
                              <p className="mt-0.5 text-xs text-console-muted">
                                Party of {row.guestCount}
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
                        </li>
                      )
                    })}
                  </ul>
                )}

                <div className="border-t border-console-border px-5 py-3">
                  <Link
                    href="/dashboard/restaurant/reservations"
                    className="text-[13px] font-semibold text-console-indigo hover:underline"
                  >
                    View all reservations
                  </Link>
                </div>
              </section>
            </div>

            <div className="min-w-0 space-y-6">
              <ConsoleUpcomingList
                events={data.upcoming}
                title="Upcoming Reservations"
                viewAllHref="/dashboard/restaurant/reservations"
                manageHref="/dashboard/restaurant/reservations"
                detailHrefFor={(event) => {
                  const branch = data.branches.find(
                    (b) => b.name === event.venue,
                  )
                  return branch ? `/restaurants/${data.business?.id}?branch=${branch.id}` : '/restaurants'
                }}
                emptyHint="No open bookings yet."
              />
              <ConsoleAreaChart
                series={data.series}
                title="Covers Overview"
                unit="Covers"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}