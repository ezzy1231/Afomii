import type { Metadata } from 'next'
import Link from 'next/link'
import { ConsolePageShell, ConsoleHeader } from '@/components/dashboard/console'
import RestaurantListingForm from '@/components/dashboard/RestaurantListingForm'

export const metadata: Metadata = { title: 'New listing · Restaurant' }

export default function NewListingPage() {
  return (
    <ConsolePageShell maxWidth="max-w-3xl">
      <Link
        href="/dashboard/restaurant/listings"
        className="text-xs font-semibold uppercase tracking-widest text-app-muted transition-colors hover:text-ember"
      >
        ← Back to listings
      </Link>

      <ConsoleHeader eyebrow="Partner console" title="New listing" />

      <div className="glass rounded-2xl p-6 text-app-fg [&_h2]:text-app-fg [&_p]:text-app-muted [&_span]:text-app-muted [&_input]: [&_input]:border-app-border [&_input]:text-app-fg [&_input]:placeholder:text-app-muted/60 [&_button[type='submit']]:bg-ember [&_button[type='submit']]:text-white [&_button[type='submit']]:min-h-[44px] [&_button[type='submit']]:rounded-full">
        <RestaurantListingForm />
      </div>
      <p className="px-1 text-xs text-app-muted">
        After creating the listing, add a branch and menu items — then set your opening hours.
      </p>
    </ConsolePageShell>
  )
}
