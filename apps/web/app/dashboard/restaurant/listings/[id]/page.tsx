import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnedListing } from '@/lib/dashboard/listing-data'
import { ListingTabs } from '@/components/dashboard/listing-tabs'
import { ListingDetails } from '@/components/dashboard/listing-details'

export const metadata: Metadata = { title: 'Listing · Restaurant' }

export default async function ListingDetailPage({
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
      <ListingDetails listing={listing} />
    </div>
  )
}