import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerDashboard } from '@/lib/dashboard/organizer-data'
import { ConsoleStatRow } from '@/components/dashboard/console-primitives'
import { ConsoleEventCalendar } from '@/components/dashboard/console-event-calendar'
import { ConsoleAreaChart } from '@/components/dashboard/console-area-chart'
import { ConsoleUpcomingList } from '@/components/dashboard/console-upcoming-list'
import { CONSOLE_CARD } from '@/components/dashboard/console-tokens'

export const metadata: Metadata = { title: 'Organizer Dashboard' }

export default async function OrganizerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/organizer')

  const data = await getOrganizerDashboard(supabase, user)

  return (
    <div className="space-y-6">
      {!data.organizer ? (
        <section className={`${CONSOLE_CARD} border-dashed p-10 text-center`}>
          <p className="font-semibold text-console-ink">No organizer profile yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-console-muted">
            Your account is not connected to an organizer, so events cannot be created. Finish setup
            and this dashboard fills in.
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
          <ConsoleStatRow stats={data.stats} />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="min-w-0">
              <ConsoleEventCalendar
                events={data.calendar}
                createHref="/dashboard/organizer/events/new"
              />
            </div>

            <div className="min-w-0 space-y-6">
              <ConsoleUpcomingList
                events={data.upcoming}
                title="Upcoming Events"
                viewAllHref="/dashboard/organizer/events"
                manageHref="/dashboard/organizer/events"
                listingHrefPrefix="/events"
                emptyHint="No dated events in the next 30 days."
              />
              <ConsoleAreaChart
                series={data.series}
                title="Tickets Sold Overview"
                unit="Tickets Sold"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}