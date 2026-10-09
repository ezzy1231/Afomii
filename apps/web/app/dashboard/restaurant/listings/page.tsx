import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnedListings, type OwnedListing } from '@/lib/dashboard/listing-data'
import { ConsoleStack } from '@/components/dashboard/console-primitives'
import { ListingActions } from '@/components/dashboard/listing-actions'
import { UnassignedBranches } from '@/components/dashboard/unassigned-branches'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Listings · Restaurant' }

function relativeTime(value: string | null) {
  if (!value) return null
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 30) return `Updated ${days} days ago`
  const months = Math.round(days / 30)
  return `Updated ${months} month${months === 1 ? '' : 's'} ago`
}

function initialsFor(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * The venue's own photograph, at the size a person would recognise it by.
 * Falls back to initials on a tonal plate rather than a broken image box.
 */
function ListingThumb({ listing }: { listing: OwnedListing }) {
  return (
    <div className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-console-bg">
      {listing.cover_url ? (
        <Image
          src={listing.cover_url}
          alt=""
          fill
          sizes="72px"
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-full items-center justify-center text-lg font-bold text-console-muted"
        >
          {initialsFor(listing.name)}
        </span>
      )}
    </div>
  )
}

export default async function RestaurantListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const listings = await getOwnedListings(supabase, user)

  const { data: unassigned } = await supabase
    .from('branches')
    .select('id, branch_name, address')
    .is('restaurant_id', null)
    .order('created_at', { ascending: true })

  const liveCount = listings.filter((listing) => listing.is_active).length

  return (
    <ConsoleStack
      title="Your listings"
      subtitle={
        listings.length
          ? `${countLabel(liveCount, 'live listing')}, ${countLabel(listings.length - liveCount, 'paused')}.`
          : 'Each listing holds its own branches and menu.'
      }
      action={
        <Link
          href="/dashboard/restaurant/listings/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-console-indigo px-5 text-sm font-semibold text-white shadow-[0_6px_18px_rgb(91_63_240/0.28)] transition-colors hover:bg-console-indigo-deep"
        >
          New listing
        </Link>
      }
    >
      {listings.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-console-border px-6 py-14 text-center">
          <h2 className="text-xl font-bold text-console-ink">No listings yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-console-muted">
            A listing is one venue. Create it here, then add its branches and give each one a menu.
          </p>
          <Link
            href="/dashboard/restaurant/listings/new"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-console-indigo px-6 text-sm font-semibold text-white shadow-[0_6px_18px_rgb(91_63_240/0.28)] transition-colors hover:bg-console-indigo-deep"
          >
            Create your first listing
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {listings.map((listing) => {
            const updated = relativeTime(listing.updated_at)
            const place = [listing.area_label, listing.city].filter(Boolean).join(', ')

            return (
              <li key={listing.id}>
                <div
                  className={cn(
                    'flex overflow-hidden rounded-2xl border border-console-border bg-console-card shadow-console-card',
                    'transition-colors hover:border-console-indigo/40',
                  )}
                >
                  {/* Status as an edge rule, not a pill — reads at a glance
                      down the column without competing with the name. */}
                  <span
                    aria-hidden
                    className={cn(
                      'w-1 shrink-0',
                      listing.is_active ? 'bg-console-green' : 'bg-console-sand',
                    )}
                  />

                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:flex-nowrap">
                    <ListingThumb listing={listing} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-[15px] font-bold text-console-ink">
                          <Link
                            href={`/dashboard/restaurant/listings/${listing.id}`}
                            className="rounded outline-none hover:text-console-indigo focus-visible:text-console-indigo"
                          >
                            {listing.name}
                          </Link>
                        </h2>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            listing.is_active
                              ? 'bg-console-mint text-console-mint-ink'
                              : 'bg-console-sand text-console-sand-ink',
                          )}
                        >
                          {listing.is_active ? 'Live' : 'Paused'}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-console-muted">
                        {listing.cuisine || 'Cuisine not set'}
                        {place && <span className="text-console-border"> — </span>}
                        {place}
                      </p>

                      <p className="mt-1.5 text-xs text-console-muted tabular-nums">
                        {countLabel(listing.branchCount, 'branch', 'branches')}
                        {listing.menuItemCount > 0 && (
                          <span> · {countLabel(listing.menuItemCount, 'dish', 'dishes')}</span>
                        )}
                        {updated && <span> · {updated}</span>}
                      </p>
                    </div>

                    <ListingActions
                      listingId={listing.id}
                      listingName={listing.name}
                      isActive={listing.is_active}
                      branchCount={listing.branchCount}
                      menuItemCount={listing.menuItemCount}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {listings.length > 0 && (
        <UnassignedBranches
          branches={unassigned ?? []}
          listings={listings.map((listing) => ({ id: listing.id, name: listing.name }))}
        />
      )}
    </ConsoleStack>
  )
}