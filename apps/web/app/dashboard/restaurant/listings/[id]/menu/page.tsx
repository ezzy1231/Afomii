import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnedListing } from '@/lib/dashboard/listing-data'
import { ListingTabs } from '@/components/dashboard/listing-tabs'
import { MenuManager } from '@/components/dashboard/menu-manager'

export const metadata: Metadata = { title: 'Menu · Listing' }

export default async function ListingMenuPage({
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
      <MenuManager
        restaurantId={listing.id}
        listingName={listing.name}
        branchesHref={`/dashboard/restaurant/listings/${listing.id}/branches`}
      />
    </div>
  )
}