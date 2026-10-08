import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerEventRecords } from '@/lib/dashboard/organizer-data'
import { OrganizerEventGrid } from '@/components/dashboard/organizer-event-grid'
import { ConsoleStack } from '@/components/dashboard/console-primitives'
import { CONSOLE_CARD } from '@/components/dashboard/console-tokens'

export const metadata: Metadata = { title: 'Organizer Events' }

export default async function OrganizerEventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/organizer/events')

  const { events } = await getOrganizerEventRecords(supabase, user)

  return (
    <ConsoleStack
      eyebrow="Organizer"
      title="Events"
      subtitle={
        events.length > 0
          ? `${events.length} ${events.length === 1 ? 'event' : 'events'} · ${
              events.filter((e) => e.isActive).length
            } published`
          : 'Manage your published and draft events.'
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
      {events.length === 0 ? (
        <div className={`${CONSOLE_CARD} border-dashed p-10 text-center`}>
          <p className="font-semibold text-console-ink">No events yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-console-muted">
            Create your first event to start selling tickets.
          </p>
          <Link
            href="/dashboard/organizer/events/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-console-indigo px-5 text-sm font-semibold text-white transition-colors hover:bg-console-indigo-deep"
          >
            Create event
          </Link>
        </div>
      ) : (
        <OrganizerEventGrid events={events} />
      )}
    </ConsoleStack>
  )
}