'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { reportErrorClient } from '@/lib/monitoring'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportErrorClient(error, { boundary: 'global' })
  }, [error])

  return (
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-12">
      <section className="card-elevated animate-fade-in-up w-full p-8 sm:p-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ember">Something went wrong</p>
        <h1 className="font-serif text-3xl font-bold text-app-fg">We hit a temporary issue.</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">
          Please try again. If this keeps happening, refresh the page in a few seconds.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-primary"
          >
            Try again
          </button>
          {/* Deliberately not <Navbar />: this is the global error boundary, so
              pulling in the session-dependent nav risks re-throwing here. */}
          <Link href="/" className="btn-ghost">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}
