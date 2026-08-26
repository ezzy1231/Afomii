import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Self-healing partner provisioning.
 *
 * Accounts created before the callback-redirect fix (or through any path that
 * skips /auth/callback) can lack their businesses/organizers row. When the
 * signup metadata says they SHOULD be a partner, provision the row on first
 * dashboard view instead of dead-ending them.
 */

function slugify(name: string, uid: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'partner'
  return `${base}-${uid.slice(0, 6)}`
}

type AnyUser = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

function metaStr(meta: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = meta?.[key]
  return typeof v === 'string' ? v : undefined
}

export async function ensureOrganizer(
  supabase: SupabaseClient,
  user: AnyUser
): Promise<{ id: string; name: string } | null> {
  const meta = user.user_metadata ?? {}
  const existing = await supabase
    .from('organizers')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (existing.data) return existing.data

  const name = (
    metaStr(meta, 'org_name') ??
    metaStr(meta, 'full_name') ??
    user.email?.split('@')[0] ??
    'Organizer'
  ).trim()
  if (!name) return null

  const { data: created } = await supabase
    .from('organizers')
    .insert({
      owner_id: user.id,
      name,
      slug: slugify(name, user.id),
      category: metaStr(meta, 'org_category') ?? 'other',
      description: metaStr(meta, 'org_description') ?? '',
      address: metaStr(meta, 'org_address') ?? '',
      city: metaStr(meta, 'org_city') ?? '',
      country: metaStr(meta, 'org_country') ?? '',
      phone: metaStr(meta, 'org_phone') ?? '',
      website: metaStr(meta, 'org_website') ?? '',
      plan: metaStr(meta, 'org_plan') ?? 'free',
    })
    .select('id, name')
    .maybeSingle()

  return created ?? null
}

export async function ensureBusiness(
  supabase: SupabaseClient,
  user: AnyUser
): Promise<{ id: string; name: string } | null> {
  const meta = user.user_metadata ?? {}
  const existing = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (existing.data) return existing.data

  const name = (
    metaStr(meta, 'business_name') ??
    metaStr(meta, 'full_name') ??
    user.email?.split('@')[0] ??
    ''
  ).trim()
  if (!name) return null

  const { data: created } = await supabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name,
      slug: slugify(name, user.id),
      category: metaStr(meta, 'business_category') ?? 'restaurant',
      description: metaStr(meta, 'business_description') ?? '',
      address: metaStr(meta, 'business_address') ?? '',
      city: metaStr(meta, 'business_city') ?? '',
      country: metaStr(meta, 'business_country') ?? '',
      phone: metaStr(meta, 'business_phone') ?? '',
      website: metaStr(meta, 'business_website') ?? '',
      plan: metaStr(meta, 'business_plan') ?? 'free',
    })
    .select('id, name')
    .maybeSingle()

  return created ?? null
}
