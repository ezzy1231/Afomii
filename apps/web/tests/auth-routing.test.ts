import { describe, expect, it } from 'vitest'
import { resolveAuthDestination } from '@/lib/auth-routing'

/**
 * The bug: a first-time Google sign-in carries no role metadata, so
 * `handle_new_user` defaults `profiles.role` to 'customer'. The callback read
 * that default as a real choice and sent the user to '/', so a brand-new OAuth
 * user was never asked to pick a role.
 */
describe('resolveAuthDestination', () => {
  it('asks a brand-new Google user to pick a role', () => {
    // What the trigger produces for an OAuth signup: customer, no metadata role.
    expect(
      resolveAuthDestination({ role: 'customer', explicitNext: null }),
    ).toBe('/auth/role')
  })

  it('asks when the profile row is missing entirely', () => {
    expect(resolveAuthDestination({ role: null, explicitNext: null })).toBe('/auth/role')
  })

  it('keeps the intended destination on the picker link', () => {
    expect(
      resolveAuthDestination({ role: 'customer', explicitNext: '/plans' }),
    ).toBe('/auth/role?next=%2Fplans')
  })

  it('does not re-ask a Google user who already picked customer', () => {
    expect(
      resolveAuthDestination({
        role: 'customer',
        roleSelectedFlag: true,
        explicitNext: null,
      }),
    ).toBe('/')
  })

  it('does not re-ask a Google user who picked a partner role', () => {
    expect(
      resolveAuthDestination({
        role: 'food_business',
        roleSelectedFlag: true,
        explicitNext: null,
      }),
    ).toBe('/dashboard/restaurant')
  })

  it('routes a provisioned admin without an onboarding flag', () => {
    // Admins are provisioned out of band; the trigger default cannot make one.
    expect(resolveAuthDestination({ role: 'system_admin', explicitNext: null })).toBe(
      '/dashboard/admin',
    )
    expect(resolveAuthDestination({ role: 'event_organizer', explicitNext: null })).toBe(
      '/dashboard/organizer',
    )
  })

  it('treats an email signup as having chosen, via signup metadata', () => {
    // /auth/signup/user passes data: { role: 'customer' } to signUp().
    expect(
      resolveAuthDestination({
        role: 'customer',
        signupRole: 'customer',
        explicitNext: null,
      }),
    ).toBe('/')
  })

  it('honours a stashed destination once a role exists', () => {
    expect(
      resolveAuthDestination({
        role: 'customer',
        roleSelectedFlag: true,
        explicitNext: '/plans',
      }),
    ).toBe('/plans')
  })

  it('ignores an empty or falsy selection flag', () => {
    for (const flag of [undefined, null, false, '', 0]) {
      expect(
        resolveAuthDestination({ role: 'customer', roleSelectedFlag: flag, explicitNext: null }),
      ).toBe('/auth/role')
    }
  })

  it('falls back to home for an unrecognised role that has a flag', () => {
    expect(
      resolveAuthDestination({
        role: 'something_else',
        roleSelectedFlag: true,
        explicitNext: null,
      }),
    ).toBe('/')
  })
})
