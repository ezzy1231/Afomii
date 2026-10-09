import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnedListing } from '@/lib/dashboard/listing-data'
import { ListingTabs } from '@/components/dashboard/listing-tabs'
import { BranchManager } from '@/components/dashboard/branch-manager'

export const metadata: Metadata = { title: 'Branches · Listing' }

export default async function ListingBranchesPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/restaurant/listings')

  const listing = await getOwnedListing(supabase, user, params.id)
  if (!listing) notFound()

  return (
    <div className="space-y-6">
      <ListingTabs listingId={listing.id} listingName={listing.name} />
      <BranchManager restaurantId={listing.id} listingName={listing.name} />
    </div>
  )
}