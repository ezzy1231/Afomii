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

/**
 * Reads the owner's single partner row.
 *
 * Ordered + limited rather than `.maybeSingle()`: if duplicates exist
 * (they could before migration 0015 added the unique index, because a
 * layout and its page can self-heal concurrently) `maybeSingle()` errors
 * and the dashboard can no longer resolve whose row it is. Oldest wins,
 * matching the dedupe in that migration so `events` / `branches` /
 * `reservations` keep pointing at the surviving row.
 */
async function readOwnedRow(
  supabase: SupabaseClient,
  table: 'organizers' | 'businesses',
  userId: string,
) {
  const { data } = await supabase
    .from(table)
    .select('id, name')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  return (data?.[0] as { id: string; name: string } | undefined) ?? null
}

export async function ensureOrganizer(
  supabase: SupabaseClient,
  user: AnyUser
): Promise<{ id: string; name: string } | null> {
  const meta = user.user_metadata ?? {}
  const existing = await readOwnedRow(supabase, 'organizers', user.id)
  if (existing) return existing

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
  const existing = await readOwnedRow(supabase, 'businesses', user.id)
  if (existing) return existing

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
