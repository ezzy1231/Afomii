import type { SupabaseClient } from '@supabase/supabase-js'

const LISTING_COLUMNS =
  'id,name,cuisine,city,area_label,closing_label,cover_url,is_active,opening_hours,updated_at'

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
  updated_at: string | null
  /** Locations attached to this listing, and how many dishes they serve. */
  branchCount: number
  menuItemCount: number
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

  const listings = (data ?? []) as Array<Omit<OwnedListing, 'branchCount' | 'menuItemCount'>>
  if (listings.length === 0) return []

  // Two aggregate reads beat one per listing: a partner with five venues
  // should not trigger five round trips just to show counts.
  const { data: branchRows } = await supabase
    .from('branches')
    .select('id, restaurant_id')
    .eq('business_id', business.id)

  const branches = (branchRows ?? []) as Array<{ id: string; restaurant_id: string | null }>
  const branchCountByListing = new Map<string, number>()
  const branchIdByListing = new Map<string, string[]>()
  for (const branch of branches) {
    if (!branch.restaurant_id) continue
    branchCountByListing.set(
      branch.restaurant_id,
      (branchCountByListing.get(branch.restaurant_id) ?? 0) + 1,
    )
    const ids = branchIdByListing.get(branch.restaurant_id) ?? []
    ids.push(branch.id)
    branchIdByListing.set(branch.restaurant_id, ids)
  }

  const allBranchIds = branches.map((branch) => branch.id)
  const { data: menuRows } = allBranchIds.length
    ? await supabase.from('menu_items').select('branch_id').in('branch_id', allBranchIds)
    : { data: [] as Array<{ branch_id: string }> }

  const menuCountByBranch = new Map<string, number>()
  for (const row of (menuRows ?? []) as Array<{ branch_id: string }>) {
    menuCountByBranch.set(row.branch_id, (menuCountByBranch.get(row.branch_id) ?? 0) + 1)
  }

  return listings.map((listing) => {
    const ids = branchIdByListing.get(listing.id) ?? []
    return {
      ...listing,
      branchCount: branchCountByListing.get(listing.id) ?? 0,
      menuItemCount: ids.reduce((sum, id) => sum + (menuCountByBranch.get(id) ?? 0), 0),
    }
  })
}