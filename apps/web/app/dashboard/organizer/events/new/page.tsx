import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerAccount, organizerIsPublic } from '@/lib/dashboard/organizer-data'
import { ConsolePageShell, ConsoleHeader } from '@/components/dashboard/console'
import EventListingForm from '@/components/dashboard/EventListingForm'

export const metadata: Metadata = { title: 'New event · Organizer' }

export default async function NewOrganizerEventPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/organizer/events/new')

  const account = await getOrganizerAccount(supabase, user)

  const visibilityWarning = account
    ? organizerIsPublic(account)
      ? null
      : 'Your organizer profile is not verified yet, so events you publish will not appear on the home page, /events, or search until it is.'
    : null

  return (
    <ConsolePageShell maxWidth="max-w-3xl">
      <Link
        href="/dashboard/organizer/events"
        className="text-xs font-semibold uppercase tracking-widest text-app-muted transition-colors hover:text-ember"
      >
        ← Back to events
      </Link>

      <ConsoleHeader
        eyebrow="Organizer"
        title="Create event"
        subtitle="Publish an upcoming event to the discover feed."
      />

      <EventListingForm
        successHref="/dashboard/organizer/events"
        visibilityWarning={visibilityWarning}
      />

      <p className="px-1 text-xs text-app-muted">
        After creating the event you can add more ticket tiers, review sales and edit the
        listing from the Events tab.
      </p>
    </ConsolePageShell>
  )
}
