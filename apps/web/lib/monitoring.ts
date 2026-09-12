/**
 * Error reporting hub (M3 observability).
 *
 * `logActionError()` (lib/validation.ts) is the single server-action seam —
 * 34 call sites already route through it. `reportError` here adds Sentry
 * capture when SENTRY_DSN is configured and is a no-op otherwise, so local
 * dev and CI run with zero overhead.
 *
 * Client-side: reportErrorClient mirrors this for error boundaries.
 */
import * as Sentry from '@sentry/nextjs'

let sentryChecked = false
let sentryEnabled = false

/** Sentry is active only when a DSN is present in the environment. */
function isSentryEnabled(): boolean {
  if (!sentryChecked) {
    sentryChecked = true
    sentryEnabled = Boolean(
      process.env.SENTRY_DSN &&
        process.env.SENTRY_DSN.startsWith('https://') &&
        process.env.SENTRY_DSN.includes('@')
    )
  }
  return sentryEnabled
}

/**
 * Report a server-side error to monitoring. Never throws — reporting
 * failures must not break the action that is already handling an error.
 */
export function reportError(scope: string, err: unknown, context?: Record<string, unknown>): void {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[${scope}] ${message}`)

  if (!isSentryEnabled()) return
  try {
    Sentry.captureException(err, {
      tags: { scope },
      extra: context,
    })
  } catch {
    // Monitoring must never take the app down.
  }
}

/**
 * Report a client-side error (from error boundaries) when monitoring is
 * configured. Safe to import into client components.
 */
export function reportErrorClient(err: unknown, context?: Record<string, unknown>): void {
  if (typeof window === 'undefined') {
    // Called on the server (e.g. during SSR) — route to the server reporter.
    reportError('client-boundary', err, context)
    return
  }

  console.error(err)

  if (!isSentryEnabled()) return
  try {
    // Dynamic import keeps the SDK out of the initial client bundle; it is
    // only loaded when a boundary actually catches something.
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(err, { extra: context })
    })
  } catch {
    // noop
  }
}
