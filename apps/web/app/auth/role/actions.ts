'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureBusiness, ensureOrganizer } from '@/lib/provision'
import { userRoleSchema, firstIssue, logActionError } from '@/lib/validation'
import { RATE_LIMIT_MESSAGE, guardActionLimit } from '@/lib/rate-limit'

/**
 * Where each role lands after role selection.
 * Mirrors the routing in `app/auth/callback/route.ts` so a user who picks a
 * role here and one who already had one end up in the same place.
 */
const ROLE_DESTINATION: Record<string, string> = {
  customer: '/',
  food_business: '/dashboard/restaurant',
  event_organizer: '/dashboard/organizer',
  system_admin: '/dashboard/admin',
}

/** Only allow same-site relative paths (open-redirect guard). */
function safeNext(raw: FormDataEntryValue | null): string {
  const value = typeof raw === 'string' ? raw : '/'
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
}

/**
 * Assign a role to the CURRENTLY SIGNED-IN user.
 *
 * This is the path an OAuth (Google) user takes: they authenticated
 * successfully but arrive with no role, because Google identities carry no
 * `user_metadata.role`. Previously `/auth/role` only linked to the password
 * signup forms, so an already-registered user clicking a role card landed on
 * a "create account" form for an email that already existed — Supabase
 * rejected it and bounced them back to sign-in. This action persists the role
 * against the live session instead, and provisions the partner record so the
 * matching dashboard has something to render.
 */
export async function assignRole(formData: FormData): Promise<void> {
  const parsed = userRoleSchema.safeParse(formData.get('role'))
  const next = safeNext(formData.get('next'))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // No session — this is a genuine signup visitor, send them to sign-in.
  if (!user) {
    redirect(`/auth/signin?next=${encodeURIComponent('/auth/role')}`)
  }

  if (!parsed.success) {
    logActionError('assignRole', firstIssue(parsed.error))
    redirect(`/auth/role?error=${encodeURIComponent('Pick a role to continue.')}`)
  }

  const role = parsed.data

  // Self-service role escalation guard: an admin account must never be
  // claimable from the public role picker. Admins are provisioned out of band.
  if (role === 'system_admin') {
    redirect(`/auth/role?error=${encodeURIComponent('That role cannot be self-selected.')}`)
  }

  const limit = guardActionLimit('assignRole', user.id, {
    limit: 5,
    windowMs: 60_000,
  })
  if (!limit.ok) {
    redirect(`/auth/role?error=${encodeURIComponent(RATE_LIMIT_MESSAGE)}`)
  }

  const { error: upsertError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      role,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string) ?? null,
    },
    { onConflict: 'id' },
  )

  if (upsertError) {
    logActionError('assignRole.upsert', upsertError)
    redirect(`/auth/role?error=${encodeURIComponent('Could not save your role. Please try again.')}`)
  }

  // Provision the partner record so the destination dashboard is not empty.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    const userForProvision = {
      id: profile.id as string,
      email: user.email ?? null,
      user_metadata: user.user_metadata ?? {},
    }
    if (role === 'food_business') {
      await ensureBusiness(supabase, userForProvision)
    } else if (role === 'event_organizer') {
      await ensureOrganizer(supabase, userForProvision)
    }
  }

  redirect(ROLE_DESTINATION[role] ?? next)
}
