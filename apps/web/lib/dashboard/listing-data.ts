import type { SupabaseClient } from '@supabase/supabase-js'

const LISTING_COLUMNS =
  'id,name,cuisine,city,area_label,closing_label,cover_url,is_active,opening_hours'

export type OwnedListing = {
  id: string
  name: string
  cuisine: string | null
  city: string | null
  area_label: string | null
  closing_label: string | null
  cover_url: string | null
  is_active: boolean
  opening_hours: Record<string, { open: string; close: string }[]> | null
}

type UserLike = { id: string }

export async function getOwnedListing(
  supabase: SupabaseClient,
  user: UserLike,
  listingId: string,
): Promise<OwnedListing | null> {
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return null

  const { data } = await supabase
    .from('restaurants')
    .select(LISTING_COLUMNS)
    .eq('id', listingId)
    .eq('business_id', business.id)
    .maybeSingle()

  return (data as OwnedListing | null) ?? null
}

export async function getOwnedListings(
  supabase: SupabaseClient,
  user: UserLike,
): Promise<OwnedListing[]> {
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!business) return []

  const { data } = await supabase
    .from('restaurants')
    .select(LISTING_COLUMNS)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as OwnedListing[]
}