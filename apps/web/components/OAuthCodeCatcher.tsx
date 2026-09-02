'use client'

import { useEffect } from 'react'

/**
 * Catches a dangling OAuth `?code=...` that lands on any page.
 *
 * When the Supabase project's Site URL is the site root (rather than
 * /auth/callback), Google OAuth completes and the browser is sent to
 * `/?code=...`. Nothing on the home page would ever exchange that code, so
 * the session is silently never created. This component forwards the code to
 * the real callback route, which exchanges it and routes by role.
 *
 * Must be a HARD navigation (window.location.assign), not router.replace:
 * the callback route handler answers with a 307 redirect AND sets the
 * session cookies on its response — client-side router navigation can drop
 * those Set-Cookie headers, which would log the user straight back out.
 */
export default function OAuthCodeCatcher() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    // Strip the code from the current URL (history.replaceState, no reload)
    // so a refresh doesn't re-trigger the exchange.
    params.delete('code')
    const cleanQs = params.toString()
    const cleanUrl = `${window.location.pathname}${cleanQs ? `?${cleanQs}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', cleanUrl)

    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('code', code)
    window.location.assign(callbackUrl.toString())
  }, [])

  return null
}
