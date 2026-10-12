import { describe, expect, it } from 'vitest'
import { organizerIsPublic } from '@/lib/dashboard/organizer-data'

/**
 * Mirrors private.organizer_is_public() from
 * migrations/20261009115229_restaurant_event_public_visibility.sql, which
 * events_select_anon calls. Consumer pages read events through the anon
 * client, so a profile that fails this test hides every event it publishes.
 */
describe('organizerIsPublic', () => {
  it('accepts an active, verified profile', () => {
    expect(organizerIsPublic({ status: 'active', is_verified: true })).toBe(true)
  })

  it('rejects an unverified profile', () => {
    expect(organizerIsPublic({ status: 'active', is_verified: false })).toBe(false)
    expect(organizerIsPublic({ status: 'active', is_verified: null })).toBe(false)
  })

  it('rejects a profile that is not active', () => {
    expect(organizerIsPublic({ status: 'pending', is_verified: true })).toBe(false)
    expect(organizerIsPublic({ status: 'rejected', is_verified: true })).toBe(false)
    expect(organizerIsPublic({ status: 'inactive', is_verified: true })).toBe(false)
    expect(organizerIsPublic({ status: null, is_verified: true })).toBe(false)
  })

  it('rejects a suspended owner even when the profile is active', () => {
    expect(organizerIsPublic({ status: 'active', is_verified: true }, true)).toBe(false)
    expect(organizerIsPublic({ status: 'active', is_verified: true }, false)).toBe(true)
  })

  it('rejects a missing profile', () => {
    expect(organizerIsPublic(null)).toBe(false)
    expect(organizerIsPublic(undefined)).toBe(false)
  })

  it('rejects the state ensureOrganizer leaves behind', () => {
    // lib/provision.ts inserts neither status nor is_verified, so every new
    // signup lands on the column defaults.
    expect(organizerIsPublic({ status: 'pending', is_verified: false })).toBe(false)
  })
})