import { describe, expect, it } from 'vitest'
import { RIDE_BOOK_WINDOW_HOURS, isRideBookable, rideWindowHint } from '@/lib/rideWindow'

const HOUR_MS = 60 * 60 * 1000

describe('isRideBookable', () => {
  const now = new Date('2026-09-08T12:00:00Z')

  function iso(offsetHours: number): string {
    return new Date(now.getTime() + offsetHours * HOUR_MS).toISOString()
  }

  it('rejects null/invalid timestamps', () => {
    expect(isRideBookable(null, now)).toBe(false)
    expect(isRideBookable('', now)).toBe(false)
    expect(isRideBookable('not-a-date', now)).toBe(false)
  })

  it('allows booking inside the window', () => {
    expect(isRideBookable(iso(RIDE_BOOK_WINDOW_HOURS), now)).toBe(true)
    expect(isRideBookable(iso(0.5), now)).toBe(true)
    expect(isRideBookable(iso(2.99), now)).toBe(true)
  })

  it('rejects a plan too far in the future', () => {
    expect(isRideBookable(iso(RIDE_BOOK_WINDOW_HOURS + 0.01), now)).toBe(false)
    expect(isRideBookable(iso(48), now)).toBe(false)
  })

  it('graces slightly-late starts (30 min) then rejects', () => {
    expect(isRideBookable(iso(-0.4), now)).toBe(true) // 24 min ago — inside grace
    expect(isRideBookable(iso(-0.6), now)).toBe(false) // 36 min ago — outside grace
  })

  it('treats the boundary exactly', () => {
    // exactly 3h ahead is allowed (ms <= window), exactly -30min allowed (ms > -30min)
    expect(isRideBookable(iso(3), now)).toBe(true)
    const graceEdge = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    expect(isRideBookable(graceEdge, now)).toBe(false) // ms === -30min is NOT > -30min
  })
})

describe('rideWindowHint', () => {
  it('hints for missing start times', () => {
    expect(rideWindowHint(null)).toBe('Ride booking opens closer to the date.')
  })

  it('tells the user when the plan already started', () => {
    const past = new Date(Date.now() - HOUR_MS).toISOString()
    expect(rideWindowHint(past)).toBe('This plan has already started.')
  })

  it('invites booking inside the window', () => {
    const soon = new Date(Date.now() + HOUR_MS).toISOString()
    expect(rideWindowHint(soon)).toBe('Book a ride to get there on time.')
  })

  it('counts down when outside the window', () => {
    const later = new Date(Date.now() + 10 * HOUR_MS).toISOString()
    expect(rideWindowHint(later)).toBe(
      `Ride booking opens ${RIDE_BOOK_WINDOW_HOURS} hours before — about 10 hours to go.`
    )
  })
})
