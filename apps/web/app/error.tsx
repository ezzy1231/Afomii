'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
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
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-4 py-16">
      <section role="alert" className="animate-fade-in-up w-full border-l-4 border-danger pl-6">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-danger">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-bold text-app-fg sm:text-4xl">We hit a temporary issue.</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-app-muted">
          We couldn’t load this page. Check your connection and try again, or head back home.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn-primary"><RotateCcw className="size-4" aria-hidden />Try again</button>
          {/* Deliberately not <Navbar />: pulling in the session-dependent nav risks re-throwing here. */}
          <Link href="/" className="btn-secondary">Back to home</Link>
        </div>
      </section>
    </main>
  )
}
