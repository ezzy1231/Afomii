/**
 * Next.js instrumentation hook — loaded once per server start.
 * Sentry initializes only when SENTRY_DSN is set (LAUNCH_PLAN.md M3).
 * With no DSN this file is effectively a no-op, so dev/CI are unaffected.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dsn = process.env.SENTRY_DSN
    if (!dsn || !dsn.startsWith('https://')) return

    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      // Rational defaults for a launch: sample errors fully, traces lightly.
      tracesSampleRate: 0.1,
      // Drop noisy, non-actionable noise from Supabase network blips.
      ignoreErrors: [
        'Non-Error promise rejection captured',
        'fetch failed',
        'NetworkError',
      ],
    })
  }
}
