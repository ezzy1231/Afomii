'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveAuthDestination } from '@/lib/auth-routing'

/**
 * Supabase OAuth callback (client component).
 *
 * This must run in the BROWSER, not a server route handler. The PKCE code
 * verifier is written by the browser client when signInWithOAuth() runs, and on
 * Netlify no cookies survive the round-trip through Google's redirect — so a
 * server-side exchange always failed with "PKCE code verifier not found in
 * storage". The browser still has the verifier, so it completes the exchange
 * here (detectSessionInUrl is enabled on the browser client) and writes the
 * session cookies before we route on.
 */

/** Destination stashed by the sign-in page before starting the OAuth flow. */
function readStoredNext(): string | null {
  try {
    const value = sessionStorage.getItem('auth:next')
    sessionStorage.removeItem('auth:next')
    return value
  } catch {
    return null
  }
}

/** Guards against a second exchange attempt — a PKCE code is single-use. */
let exchangeStarted = false

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (exchangeStarted) return
    exchangeStarted = true

    let cancelled = false

    const oauthError = params.get('error')
    const oauthErrorDescription = params.get('error_description')

    if (oauthError) {
      setError(oauthErrorDescription || oauthError)
      return
    }

    const supabase = createClient()

    async function completeSignIn() {
      // exchangeCodeForSession reads the verifier the browser stored and, when
      // detectSessionInUrl already handled it, resolves the existing session.
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        params.get('code') ?? '',
      )

      if (cancelled) return

      if (exchangeError || !data.user) {
        // The URL may already have been consumed by detectSessionInUrl — fall
        // back to whatever session the client now holds.
        const { data: sessionData } = await supabase.auth.getSession()
        if (cancelled) return

        if (!sessionData.session) {
          setError(exchangeError?.message ?? 'Could not complete sign-in. Please try again.')
          return
        }
      }

      // `data.user` is undefined when detectSessionInUrl already consumed the
      // code: exchangeCodeForSession errors, the session exists, and the old
      // code then dereferenced `data.user!.id` further down and threw. Resolve
      // the user from whichever source actually has one.
      const { data: sessionData } = await supabase.auth.getUser()
      const user = data.user ?? sessionData.user ?? null
      if (!user) {
        setError('Could not complete sign-in. Please try again.')
        return
      }

      const next = params.get('next') ?? readStoredNext()
      // '/' is the fallback, not a choice — treating it as explicit would skip
      // role routing and land every user on the home page.
      const explicitNext =
        next && next !== '/' && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
          ? next
          : null

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) return

      /*
       * A first-time Google user carries no role metadata and the
       * handle_new_user trigger defaults profiles.role to 'customer', so the
       * callback used to read that default as a real answer and send them home
       * — the role picker was never shown. resolveAuthDestination() draws the
       * distinction; see lib/auth-routing.ts and its unit tests.
       */
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      const destination = resolveAuthDestination({
        role: (profile?.role as string | undefined) ?? null,
        roleSelectedFlag: meta.role_selected,
        signupRole: meta.role,
        explicitNext,
      })

      router.replace(destination)
      router.refresh()
    }

    completeSignIn()

    return () => {
      cancelled = true
    }
  }, [params, router])

  if (error) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="card-elevated animate-fade-in-up p-10">
          <h2 className="mb-2 font-serif text-2xl font-bold text-app-fg">Sign-in failed</h2>
          <p className="mb-6 text-sm text-app-muted">{error}</p>
          <a href="/auth/signin" className="btn-primary w-full !py-2.5">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="card-elevated animate-fade-in-up p-10">
        <h2 className="mb-2 font-serif text-2xl font-bold text-app-fg">Signing you in…</h2>
        <p className="text-sm text-app-muted">One moment while we finish.</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}