'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveListingDetails,
  setListingActive,
  type DashboardActionState,
} from '@/app/dashboard/actions'
import { StatusPill } from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { RestaurantHoursCard } from '@/components/dashboard/branch-manager'
import type { OwnedListing } from '@/lib/dashboard/listing-data'
import { cn } from '@/lib/utils'

const consoleInput =
  'w-full rounded-lg border border-app-border bg-app-bg px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/50'

export function ListingDetails({ listing }: { listing: OwnedListing }) {
  const router = useRouter()
  const [state, setState] = useState<DashboardActionState>({ ok: false, message: '' })
  const [pending, startTransition] = useTransition()

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await saveListingDetails(state, formData)
      setState(result)
      if (result.ok) router.refresh()
    })
  }

  function toggleActive() {
    startTransition(async () => {
      const result = await setListingActive(listing.id, !listing.is_active)
      setState(result)
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <section className={CONSOLE_CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Listing details</h2>
            <StatusPill
              status={listing.is_active ? 'active' : 'inactive'}
              tone={listing.is_active ? 'ok' : 'info'}
            />
          </div>
          <button
            type="button"
            onClick={toggleActive}
            disabled={pending}
            className="min-h-[36px] rounded-full border border-app-border px-4 text-xs font-semibold text-app-muted transition-colors hover:border-ember/30 disabled:opacity-50"
          >
            {listing.is_active ? 'Unpublish listing' : 'Publish listing'}
          </button>
        </div>

        <form action={save} className="grid gap-4 p-5 sm:grid-cols-2">
          <input type="hidden" name="listingId" value={listing.id} />
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-app-muted">Restaurant name</span>
            <input
              name="name"
              required
              defaultValue={listing.name}
              className={consoleInput}
              placeholder="Juniper Table"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-app-muted">Cuisine</span>
            <input
              name="cuisine"
              defaultValue={listing.cuisine ?? ''}
              className={consoleInput}
              placeholder="Modern African"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-app-muted">Area label</span>
            <input
              name="areaLabel"
              defaultValue={listing.area_label ?? ''}
              className={consoleInput}
              placeholder="West End"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs text-app-muted">City</span>
            <input
              name="city"
              required
              defaultValue={listing.city ?? ''}
              className={consoleInput}
              placeholder="Addis Ababa"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block text-xs text-app-muted">Closing label</span>
            <input
              name="closingLabel"
              defaultValue={listing.closing_label ?? ''}
              className={consoleInput}
              placeholder="Open until 11:00 PM"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className={cn(
                'min-h-[44px] rounded-full bg-ember px-6 text-sm font-semibold text-on-accent transition-all hover:brightness-110 disabled:opacity-50',
              )}
            >
              {pending ? 'Saving…' : 'Save details'}
            </button>
            {state.message && (
              <p
                role={state.ok ? 'status' : 'alert'}
                className={cn('mt-3 text-sm', state.ok ? 'text-success' : 'text-danger')}
              >
                {state.message}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
          Opening hours
        </h2>
        <RestaurantHoursCard
          restaurant={{
            id: listing.id,
            name: listing.name,
            opening_hours: listing.opening_hours,
          }}
        />
      </section>
    </div>
  )
}