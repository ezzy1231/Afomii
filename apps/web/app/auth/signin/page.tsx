'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Renders diagnostics that the server callback embeds in the redirect URL when
 * the OAuth code exchange fails (`/auth/signin?error=auth_failed&detail=...`).
 * Without this the page showed nothing, so a failed Google login looked like a
 * silent rollback to the login form. Must live under a <Suspense> boundary
 * because it calls useSearchParams.
 */
function SignInDiagnostics() {
  const params = useSearchParams()
  const error = params.get('error')
  const detail = params.get('detail')
  const host = params.get('host')
  const cookies = params.get('cookies')
  const slotsTried = params.get('slotsTried')

  if (error !== 'auth_failed' && !detail) return null
  let slots: string | null = null
  try {
    slots = slotsTried ? JSON.stringify(JSON.parse(slotsTried), null, 1) : null
  } catch {
    slots = null
  }

  return (
    <div
      role="alert"
      className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      <p className="font-bold">
        {error === 'auth_failed' ? 'Google sign-in did not complete' : 'Sign-in error'}
      </p>
      {detail && <p className="mt-1.5 break-words text-xs font-medium text-app-muted">{detail}</p>}
      {host && <p className="mt-1 text-xs text-app-muted">Host: {host}</p>}
      {(cookies || slots) && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-app-muted">
            Diagnostics: cookies received by the callback
          </summary>
          <p className="mt-1 break-words text-xs text-app-muted">{cookies}</p>
          {slots && <pre className="mt-1 break-words whitespace-pre-wrap text-xs text-app-muted">{slots}</pre>}
        </details>
      )}
      <p className="mt-2 text-xs font-medium text-app-muted">
        Please try again — if this persists, clear your site cookies and retry.
      </p>
    </div>
  )
}

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState<string | null>(null)

  function humanizeError(message: string): string {
    // Supabase error strings are developer-facing; show people-friendly copy.
    if (/invalid login credentials/i.test(message)) return 'Invalid email or password.'
    if (/rate limit/i.test(message)) return 'Too many attempts. Please wait a moment and try again.'
    return message
  }

  async function handleResend() {
    if (!confirmPending) return
    try {
      const supabase = createClient()
      await supabase.auth.resend({ type: 'signup', email: confirmPending })
      setError('Verification email re-sent. Check your inbox.')
    } catch {
      setError('Could not resend verification email. Please try again.')
    }
  }

  function destinationFor(role: string | null, next: string): string {
    // Explicit `next` always wins; otherwise route each role to its surface.
    if (next && next !== '/') return next
    switch (role) {
      case 'system_admin':
        return '/dashboard/admin' // middleware completes the bounce to :3001
      case 'food_business':
        return '/dashboard/restaurant'
      case 'event_organizer':
        return '/dashboard/organizer'
      default:
        return '/'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError(null)
    setConfirmPending(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        const errorMessage = signInError.message || 'Sign-in failed'
        if (/verify|confirm|not confirmed/i.test(errorMessage)) {
          setConfirmPending(email)
        } else {
          setError(humanizeError(errorMessage))
        }
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        const role = (profile?.role as string | undefined) ?? null

        const params = new URLSearchParams(window.location.search)
        const rawNext = params.get('next') ?? '/'
        const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

        router.push(destinationFor(role, next))
        router.refresh()
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Sign-in failed'
      if (/verify|confirm|not confirmed/i.test(errorMessage)) {
        setConfirmPending(email)
      } else {
        setError(humanizeError(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    if (googleLoading) return
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      const params = new URLSearchParams(window.location.search)
      const rawNext = params.get('next')
      const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

      // Carry the destination in sessionStorage, NOT in the OAuth redirectTo.
      // Supabase matches redirectTo against the allowlist as an exact string, so
      // appending `?next=...` makes a wildcard-free entry stop matching and the
      // provider bounces back to the Site URL instead of our callback.
      //
      // Only an EXPLICIT destination is stashed. Persisting the default '/' would
      // make the callback treat it as an explicit choice and skip role routing,
      // dumping admins on the home page.
      try {
        if (rawNext && next !== '/') {
          sessionStorage.setItem('auth:next', next)
        } else {
          sessionStorage.removeItem('auth:next')
        }
      } catch {
        // Storage unavailable (private mode) — fall back to role-based routing.
      }

      const redirectTo = `${window.location.origin}/auth/callback`

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })

      if (oauthError) {
        console.error('Google sign-in error:', oauthError)
        setError('Google sign-in failed. Please try again.')
        setGoogleLoading(false)
      }
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card-elevated animate-fade-in-up p-8 sm:p-10">
        <h1 className="text-4xl font-bold tracking-tight text-app-fg mb-1.5">Welcome back</h1>
        <p className="text-sm font-medium text-app-muted mb-8">
          Sign in to your UrbanExplore account
        </p>

        <Suspense fallback={null}>
          <SignInDiagnostics />
        </Suspense>

        {confirmPending ? (
          <div className="mb-5 rounded-xl border border-app-border bg-ember/10 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ember text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-app-fg">Confirm your email first</p>
                <p className="mt-0.5 text-sm text-app-muted">
                  We sent a confirmation link to <strong className="text-app-fg">{confirmPending}</strong>. Click it, then sign in.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  className="mt-2 text-xs font-extrabold text-ember hover:underline"
                >
                  Resend confirmation email
                </button>
              </div>
            </div>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mb-5 flex items-center gap-2.5 rounded-xl border border-app-border bg-danger/10 text-danger text-sm font-semibold px-4 py-3"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path fillRule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-app-fg mb-1.5">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium" placeholder="you@example.com" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-bold text-app-fg">Password</label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-ember hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-premium pr-11" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-fg" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-[1.5px] bg-app-border" />
          <span className="text-xs font-bold uppercase tracking-widest text-app-muted">or continue with</span>
          <div className="flex-1 h-[1.5px] bg-app-border" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="btn-secondary w-full flex items-center justify-center gap-3 !py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <p className="text-center text-sm font-medium text-app-muted mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/auth/role" className="font-extrabold text-ember hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  )
}
