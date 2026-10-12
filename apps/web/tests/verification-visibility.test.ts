import { describe, expect, it } from 'vitest'
import { organizerIsPublic } from '@/lib/dashboard/organizer-data'
import { businessIsPublic } from '@/lib/dashboard/restaurant-data'
import { verificationIsOpen } from '@/lib/dashboard/verification-data'

/**
 * Mirrors private.business_is_public / private.organizer_is_public from
 * migrations/20261009115229_restaurant_event_public_visibility.sql, which
 * restaurants_select_anon and events_select_anon call.
 */
describe('businessIsPublic', () => {
  it('accepts an active, verified business', () => {
    expect(businessIsPublic({ status: 'active', is_verified: true })).toBe(true)
  })

  it('rejects an unverified business', () => {
    expect(businessIsPublic({ status: 'active', is_verified: false })).toBe(false)
    expect(businessIsPublic({ status: 'active', is_verified: null })).toBe(false)
  })

  it('rejects a business that is not active', () => {
    expect(businessIsPublic({ status: 'pending', is_verified: true })).toBe(false)
    expect(businessIsPublic({ status: 'rejected', is_verified: true })).toBe(false)
    expect(businessIsPublic({ status: 'inactive', is_verified: true })).toBe(false)
    expect(businessIsPublic({ status: null, is_verified: true })).toBe(false)
  })

  it('rejects a missing business', () => {
    expect(businessIsPublic(null)).toBe(false)
    expect(businessIsPublic(undefined)).toBe(false)
  })

  it('rejects the state ensureBusiness leaves behind', () => {
    // lib/provision.ts inserts neither status nor is_verified, so every new
    // signup lands on the column defaults.
    expect(businessIsPublic({ status: 'pending', is_verified: false })).toBe(false)
  })
})

/**
 * Must stay in step with ux_verification_requests_open, which exists so a
 * partner resubmitting updates their live request instead of adding a second
 * row to the admin queue.
 */
describe('verificationIsOpen', () => {
  it('treats the three live statuses as open', () => {
    expect(verificationIsOpen('pending')).toBe(true)
    expect(verificationIsOpen('in_review')).toBe(true)
    expect(verificationIsOpen('needs_info')).toBe(true)
  })

  it('treats a decided request as closed so history is kept', () => {
    expect(verificationIsOpen('approved')).toBe(false)
    expect(verificationIsOpen('rejected')).toBe(false)
  })

  it('treats unknown or missing status as closed rather than assuming it is queued', () => {
    expect(verificationIsOpen(null)).toBe(false)
    expect(verificationIsOpen(undefined)).toBe(false)
    expect(verificationIsOpen('something_else')).toBe(false)
  })
})