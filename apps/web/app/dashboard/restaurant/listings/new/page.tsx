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
        className="text-xs font-semibold uppercase tracking-widest text-[#7587A7] transition-colors hover:text-[#DFC391]"
      >
        ← Back to listings
      </Link>

      <ConsoleHeader eyebrow="Partner console" title="New listing" />

      <div className="rounded-lg border border-[#4d5f7d]/20 bg-[#0B1D31] p-6 text-[#F5EFE8] shadow-[0_4px_20px_rgba(0,0,0,0.2)] [&_h2]:text-[#F5EFE8] [&_p]:text-[#B5C7EA] [&_span]:text-[#B5C7EA] [&_input]:bg-[#07192B] [&_input]:border-[#4d5f7d]/30 [&_input]:text-[#F5EFE8] [&_input]:placeholder:text-[#7587A7]/60 [&_button[type='submit']]:bg-[#C2A878] [&_button[type='submit']]:text-navy [&_button[type='submit']]:min-h-[44px] [&_button[type='submit']]:rounded-full">
        <RestaurantListingForm />
      </div>
      <p className="px-1 text-xs text-[#7587A7]">
        After creating the listing, add a branch and menu items — then set your opening hours.
      </p>
    </ConsolePageShell>
  )
}
