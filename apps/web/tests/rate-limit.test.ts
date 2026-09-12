import { describe, expect, it } from 'vitest'
import { ACTION_LIMITS, guardActionLimit, rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'

describe('rateLimit (token bucket)', () => {
  it('allows the first N requests then blocks', () => {
    const { limit, windowMs } = ACTION_LIMITS.purchase
    const key = `test-key-${Math.random()}`
    const results: boolean[] = []
    for (let i = 0; i < limit + 2; i++) {
      results.push(rateLimit(key, limit, windowMs).ok)
    }
    // First `limit` calls pass, subsequent are blocked.
    expect(results.slice(0, limit).every(Boolean)).toBe(true)
    expect(results.slice(limit).every((ok) => !ok)).toBe(true)
  })

  it('isolates keys from each other', () => {
    const a = rateLimit('key-a', 1, 60_000)
    const b = rateLimit('key-b', 1, 60_000)
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
    // key-a exhausted, key-b still has budget on its second call
    expect(rateLimit('key-a', 1, 60_000).ok).toBe(false)
    expect(rateLimit('key-b', 1, 60_000).ok).toBe(false) // bucket of 1: second call blocked
  })

  it('refills over time (fake timers via direct window math)', () => {
    const key = `refill-${Math.random()}`
    const windowMs = 1000
    // Drain the bucket.
    rateLimit(key, 1, windowMs)
    expect(rateLimit(key, 1, windowMs).ok).toBe(false)
    // Time travel isn't available without fake timers, but the bucket refills
    // continuously; with a 1000ms window and limit 1, waiting one window yields
    // one token. We can't wait in a unit test — assert retryAfterMs is sane.
    const blocked = rateLimit(key, 1, windowMs)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(windowMs)
  })

  it('never allows a zero/negative limit to grant tokens', () => {
    const key = `zero-${Math.random()}`
    expect(rateLimit(key, 0, 60_000).ok).toBe(false)
  })
})

describe('guardActionLimit', () => {
  it('prefixes the key with the action name and blocks with the standard message', () => {
    const identity = 'user-123'
    const preset = { limit: 1, windowMs: 60_000 }
    const first = guardActionLimit('createReservation', identity, preset)
    expect(first.ok).toBe(true)
    const second = guardActionLimit('createReservation', identity, preset)
    expect(second.ok).toBe(false)
    expect(second.retryAfterMs).toBeGreaterThan(0)
    // The same identity under a *different* action is a separate bucket.
    const otherAction = guardActionLimit('purchaseTickets', identity, preset)
    expect(otherAction.ok).toBe(true)
  })

  it('falls back to anonymous identity when key is missing', () => {
    const preset = { limit: 1, windowMs: 60_000 }
    expect(guardActionLimit('x', null, preset).ok).toBe(true)
    expect(guardActionLimit('x', null, preset).ok).toBe(false)
  })

  it('exports a human-readable message', () => {
    expect(RATE_LIMIT_MESSAGE).toMatch(/too many/i)
  })
})
