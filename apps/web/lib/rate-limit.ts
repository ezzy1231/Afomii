import { logActionError } from '@/lib/validation'
/**
 * Simple in-process rate limiter for public Server Actions
 * (PRODUCTION_READINESS_PLAN §D2 — "Rate limiting for public Server Actions
 * since Supabase direct calls bypass the Nest throttler").
 *
 * Design notes:
 * - Token bucket per key (user id when signed in, else client IP).
 * - In-process by design: zero dependencies, works on any host. On
 *   multi-instance deployments each instance enforces its own bucket — the
 *   effective limit scales with instance count, which is fine for stopping
 *   burst abuse. Swap the store for Upstash REST later without changing
 *   call sites (see `LAUNCH_PLAN.md` M3).
 * - Buckets are pruned lazily; memory is bounded by distinct keys within
 *   the window.
 */

type Bucket = {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

/** Prune buckets that have been idle longer than the window. */
function prune(now: number, windowMs: number) {
  // Run at most once per window to amortize cost.
  if (now < (prune as any).nextRunAt) return
  ;(prune as any).nextRunAt = now + windowMs
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > windowMs * 2) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  /** Milliseconds until the next token is available (0 when allowed). */
  retryAfterMs: number
}

/**
 * Consume one token for `key`. Returns ok:false when the bucket is empty.
 * @param key        Stable identity — user id or IP.
 * @param limit      Tokens per window.
 * @param windowMs   Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  prune(now, windowMs)

  // A non-positive limit must never grant tokens.
  if (limit <= 0 || windowMs <= 0) {
    return { ok: false, retryAfterMs: windowMs > 0 ? windowMs : 60_000 }
  }

  const refillRate = limit / windowMs // tokens per ms
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { tokens: limit - 1, lastRefill: now } // consume the first token
    buckets.set(key, bucket)
    return { ok: true, retryAfterMs: 0 }
  }

  // Refill continuously based on elapsed time.
  const elapsed = now - bucket.lastRefill
  const refilled = Math.min(limit, bucket.tokens + elapsed * refillRate)
  if (refilled < 1) {
    return { ok: false, retryAfterMs: Math.ceil(((1 - refilled) / refillRate) / 1) }
  }
  bucket.tokens = refilled - 1
  bucket.lastRefill = now
  return { ok: true, retryAfterMs: 0 }
}

/**
 * Standard action limits shared by the public mutating actions.
 * (Values chosen to be generous for humans, expensive for scripts.)
 */
export const ACTION_LIMITS = {
  /** Ticket purchases: 5 per minute per identity. */
  purchase: { limit: 5, windowMs: 60_000 },
  /** Reservations: 6 per minute per identity (covers retry flows). */
  reserve: { limit: 6, windowMs: 60_000 },
  /** Listing creation: 3 per 10 minutes per identity. */
  createListing: { limit: 3, windowMs: 600_000 },
} as const

/** Message returned to users when a rate limit trips. */
export const RATE_LIMIT_MESSAGE =
  'Too many attempts — please wait a moment and try again.'

/**
 * Guard a server action: consume a token for the given identity or return
 * the standard failure payload.
 */
export function guardActionLimit(
  action: string,
  key: string | null | undefined,
  preset: { limit: number; windowMs: number }
): RateLimitResult {
  const identity = key ?? 'anonymous'
  const result = rateLimit(`${action}:${identity}`, preset.limit, preset.windowMs)
  if (!result.ok) {
    logActionError('rateLimit', `${action} blocked identity=${identity} retry_after=${result.retryAfterMs}ms`)
  }
  return result
}
