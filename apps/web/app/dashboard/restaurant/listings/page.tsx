import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnedListings } from '@/lib/dashboard/listing-data'
import { ConsoleHeader, StatusPill } from '@/components/dashboard/console'
import { ConsoleStack } from '@/components/dashboard/console-primitives'
import { UnassignedBranches } from '@/components/dashboard/unassigned-branches'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Listings · Restaurant' }

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

  return (
    <ConsoleStack>
      <ConsoleHeader
        eyebrow="Partner console"
        title="Listings"
        subtitle="Open a listing to manage its branches, availability, and menu."
        action={
          <Link
            href="/dashboard/restaurant/listings/new"
            className="min-h-[44px] rounded-full border border-dashed border-app-border px-5 py-2.5 text-sm font-semibold text-ember transition-colors hover:border-ember/40 hover:bg-ember/10"
          >
            ＋ New listing
          </Link>
        }
      />

      {listings.length === 0 ? (
        <div className={cn(CONSOLE_CARD, 'border-dashed p-10 text-center')}>
          <p className="font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-app-muted">
            Create your first listing so diners can find and book you.
          </p>
          <Link
            href="/dashboard/restaurant/listings/new"
            className="mt-4 inline-block min-h-[44px] rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-on-accent shadow-glass transition-all hover:brightness-110"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((row) => (
            <Link
              key={row.id}
              href={`/dashboard/restaurant/listings/${row.id}`}
              className={cn(
                CONSOLE_CARD,
                'flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-ember/40',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="text-xs capitalize text-app-muted">
                  {[row.cuisine, row.area_label, row.city].filter(Boolean).join(' · ') ||
                    'Restaurant'}
                  {row.closing_label ? ` · ${row.closing_label}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusPill
                  status={row.is_active ? 'active' : 'inactive'}
                  tone={row.is_active ? 'ok' : 'info'}
                />
                <span className="min-h-[36px] rounded-full border border-app-border px-3.5 py-1.5 text-xs font-semibold text-app-muted">
                  Manage →
                </span>
              </div>
            </Link>
          ))}
        </div>
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