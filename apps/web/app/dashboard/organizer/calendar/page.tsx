import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerCalendar } from '@/lib/dashboard/organizer-data'
import { ConsoleEventCalendar } from '@/components/dashboard/console-event-calendar'
import { ConsoleStack } from '@/components/dashboard/console-primitives'
import { CONSOLE_CARD } from '@/components/dashboard/console-tokens'

export const metadata: Metadata = { title: 'Organizer Calendar' }

export default async function OrganizerCalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/organizer/calendar')

  const { events } = await getOrganizerCalendar(supabase, user)

  return (
    <ConsoleStack
      eyebrow="Organizer"
      title="Calendar"
      subtitle={
        events.length > 0
          ? `${events.length} dated ${events.length === 1 ? 'event' : 'events'} on your schedule.`
          : 'Every event with a start date shows up here.'
      }
      action={
        <Link
          href="/dashboard/organizer/events/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-console-indigo px-4 text-sm font-semibold text-white shadow-[0_6px_18px_rgb(91_63_240/0.28)] transition-colors hover:bg-console-indigo-deep"
        >
          Create event
        </Link>
      }
    >
      <ConsoleEventCalendar
        events={events}
        createHref="/dashboard/organizer/events/new"
      />

      {events.length === 0 && (
        <div className={`${CONSOLE_CARD} border-dashed p-10 text-center`}>
          <p className="font-semibold text-console-ink">No dated events yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-console-muted">
            The calendar fills in as soon as an event has a start date. Create one to get started.
          </p>
        </div>
      )}
    </ConsoleStack>
  )
}