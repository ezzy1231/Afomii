/**
 * Where an OAuth callback sends someone after a successful exchange.
 *
 * Extracted from app/auth/callback/page.tsx so the onboarding decision is
 * unit-testable — a Google round-trip cannot be exercised locally, and this is
 * exactly the branch that was wrong.
 */

export type AuthDestinationInput = {
  /** `profiles.role` as stored, or null when the row is missing. */
  role: string | null
  /** `user_metadata.role_selected` — set by assignRole() once the picker is done. */
  roleSelectedFlag?: unknown
  /** `user_metadata.role` — email signup flows pass the chosen role here. */
  signupRole?: unknown
  /** A same-site path stashed before the OAuth redirect, already validated. */
  explicitNext: string | null
}

/** Roles the handle_new_user trigger never assigns by default. */
const PARTNER_ROLES = new Set(['food_business', 'event_organizer', 'system_admin'])

const DASHBOARD_BY_ROLE: Record<string, string> = {
  system_admin: '/dashboard/admin',
  food_business: '/dashboard/restaurant',
  event_organizer: '/dashboard/organizer',
}

/**
 * A first-time Google sign-in carries no role metadata, and
 * `handle_new_user` (0004_profiles_trigger.sql) silently defaults
 * `profiles.role` to 'customer'. So `role === 'customer'` on its own does NOT
 * mean the user chose it — that default is why new OAuth users were previously
 * sent straight to the home page and never asked to pick a role.
 *
 * "Has chosen" is therefore either the flag `assignRole()` writes back, or a
 * role in signup metadata (the email flows pass one). A partner/admin role also
 * counts, since the trigger's default can never produce one.
 */
export function resolveAuthDestination({
  role,
  roleSelectedFlag,
  signupRole,
  explicitNext,
}: AuthDestinationInput): string {
  const choseRole = Boolean(roleSelectedFlag) || Boolean(signupRole)
  const hasPartnerRole = role !== null && PARTNER_ROLES.has(role)

  if (!choseRole && !hasPartnerRole) {
    // Carry `next` through, otherwise someone who signed in from a protected
    // page loses their destination. Skipping the picker whenever `next` is set
    // would let it be bypassed entirely.
    return explicitNext ? `/auth/role?next=${encodeURIComponent(explicitNext)}` : '/auth/role'
  }

  if (explicitNext) return explicitNext
  return (role && DASHBOARD_BY_ROLE[role]) || '/'
}
