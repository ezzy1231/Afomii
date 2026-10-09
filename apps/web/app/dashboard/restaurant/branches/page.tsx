import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BranchManager } from '@/components/dashboard/branch-manager'

export const metadata: Metadata = { title: 'Branches & Availability' }

export default async function BranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const { data: listing } = business
    ? await supabase
        .from('restaurants')
        .select('id')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  if (!listing) redirect('/dashboard/restaurant/listings')

  return <BranchManager restaurantId={listing.id} />
}
