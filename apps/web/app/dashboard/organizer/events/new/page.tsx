import type { Metadata } from 'next'
import Link from 'next/link'
import { ConsolePageShell, ConsoleHeader } from '@/components/dashboard/console'
import EventListingForm from '@/components/dashboard/EventListingForm'

export const metadata: Metadata = { title: 'New event · Organizer' }

export default function NewOrganizerEventPage() {
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

      <EventListingForm successHref="/dashboard/organizer/events" />

      <p className="px-1 text-xs text-app-muted">
        After creating the event you can add more ticket tiers, review sales and edit the
        listing from the Events tab.
      </p>
    </ConsolePageShell>
  )
}
