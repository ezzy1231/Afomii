'use client'

import { useEffect } from 'react'
import { reportErrorClient } from '@/lib/monitoring'

/**
 * Shared per-route error boundary for dashboard sections (F5).
 * Keeps one section's failure (e.g. a crashed reservations table) from
 * blanking the whole dashboard shell.
 */
export default function DashboardError({
  error,
  reset,
  section,
}: {
  error: Error & { digest?: string }
  reset: () => void
  section: string
}) {
  useEffect(() => {
    reportErrorClient(error, { boundary: 'dashboard', section })
  }, [error, section])

  return (
    <section className="glass rounded-2xl p-8 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ember">
        {section} error
      </p>
      <h2 className="text-xl font-bold text-app-fg">This section hit a snag.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-muted">
        The rest of your dashboard still works. Retry this panel, or reload if
        it keeps failing.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-5">
        Retry
      </button>
    </section>
  )
}
