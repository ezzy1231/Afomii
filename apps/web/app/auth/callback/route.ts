import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { readEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Netlify rewrites request.url to the site's primary domain inside the
  // serverless function, so new URL(request.url).origin is wrong on deploy
  // previews (it would redirect to production and set cookies for the wrong
  // domain). Derive the origin from the forwarded Host header instead.
  const reqUrl = new URL(request.url)
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? reqUrl.host
  const proto = request.headers.get('x-forwarded-proto') ?? reqUrl.protocol.replace(':', '')
  const origin = `${proto}://${host}`
  console.log('[auth/callback] request.url:', request.url, 'origin:', origin)

  const { searchParams } = reqUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'

  // Open-redirect guard: only allow same-site relative paths.
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\')
      ? rawNext
      : '/'

  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/auth/signin?error=configuration', origin))
  }

  const cookieStore = await cookies()

  // Buffer cookies that setAll() is called with (e.g. during
  // exchangeCodeForSession).  On Netlify serverless functions, calling
  // cookieStore.set() inside setAll does NOT reliably attach the session
  // cookies to the outgoing response, so the browser never receives them and
  // the next request (/dashboard/admin) finds no session.  Instead we collect
  // the cookies here and apply them to the response object below.
  const pendingCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  // Two entry paths share the same provisioning:
  //  a) OAuth / email-link: exchange ?code for a session first.
  //  b) Password signup with confirmation off: the client already holds a
  //     session and is redirected here without a code.
  let user: User | null = null
  if (code) {
    // Log whether the PKCE verifier cookie (set by the browser client during
    // signInWithOAuth) actually reached this serverless function — a missing
    // verifier is the #1 cause of exchange failures on preview/multi-domain.
    const allCookies = cookieStore.getAll()
    const verifierCookie = allCookies.find((c) => c.name.includes('code-verifier'))
    console.log(
      '[auth/callback] code present, verifier cookie present:',
      verifierCookie ? 'yes' : 'NO',
      '| cookies:',
      allCookies.map((c) => c.name).join(', ')
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.code)
      // Surface the real error + the cookies the function actually received in
      // the redirect URL so it's visible without digging through server logs.
      const cookieNames = allCookies.map((c) => c.name).join(',')
      const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=auth_failed&detail=${encodeURIComponent(error.message)}&cookies=${encodeURIComponent(cookieNames)}&host=${encodeURIComponent(host ?? '')}`,
          origin
        )
      )
    } else {
      user = data.user
    }
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  /**
   * Build a redirect response and attach any buffered session cookies to it.
   * The cookies are applied to the response object (response.cookies.set)
   * rather than relying on cookieStore.set(), which is unreliable on Netlify
   * serverless functions.
   */
  function redirectTo(path: string) {
    const res = NextResponse.redirect(new URL(path, origin))
    for (const { name, value, options } of pendingCookies) {
      res.cookies.set(name, value, options)
    }
    return res
  }

  if (user) {
    // Authoritative role lives in the profiles table (set at signup by the
    // role-selection flow). user_metadata.role is often missing for OAuth
    // users (Google identity has no metadata) — fall back to it only when the
    // profile lookup yields nothing, so admins never get dumped on '/' or the
    // role-selection page after a Google login.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const role = (profile?.role as string | undefined) ?? (user.user_metadata?.role as string | undefined)

    // If no role anywhere, prompt user to select one
    if (!role) {
      return redirectTo(`/auth/role?next=${encodeURIComponent(next)}`)
    }

    if (role === 'system_admin') {
      return redirectTo('/dashboard/admin')
    }

    if (role === 'food_business') {
      const { data: existing } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!existing) {
        const meta = user.user_metadata
        const rawName = (meta.business_name as string) ?? ''
        const slug =
          rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
          '-' +
          user.id.slice(0, 6)

        // Column set must match packages/supabase/migrations (0002 + 0007).
        const { error: insertError } = await supabase.from('businesses').insert({
          owner_id: user.id,
          name: rawName,
          slug,
          category: (meta.business_category as string) ?? 'restaurant',
          description: (meta.business_description as string) ?? '',
          address: (meta.business_address as string) ?? '',
          city: (meta.business_city as string) ?? '',
          country: (meta.business_country as string) ?? '',
          phone: (meta.business_phone as string) ?? '',
          website: (meta.business_website as string) ?? '',
          plan: (meta.business_plan as string) ?? 'free',
        })

        if (insertError) {
          console.error('[auth/callback] business provisioning failed:', insertError.message)
        }
      }

      return redirectTo('/dashboard/restaurant')
    }

    if (role === 'event_organizer') {
      const { data: existing } = await supabase
        .from('organizers')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!existing) {
        const meta = user.user_metadata
        const rawName = (meta.org_name as string) ?? ''
        const slug =
          rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
          '-' +
          user.id.slice(0, 6)

        // Column set must match packages/supabase/migrations (0002 + 0007).
        // NOTE: the organizers table column is `name` (not `org_name`).
        const { error: insertError } = await supabase.from('organizers').insert({
          owner_id: user.id,
          name: rawName,
          slug,
          category: (meta.org_category as string) ?? 'other',
          description: (meta.org_description as string) ?? '',
          address: (meta.org_address as string) ?? '',
          city: (meta.org_city as string) ?? '',
          country: (meta.org_country as string) ?? '',
          phone: (meta.org_phone as string) ?? '',
          website: (meta.org_website as string) ?? '',
          plan: (meta.org_plan as string) ?? 'free',
        })

        if (insertError) {
          console.error('[auth/callback] organizer provisioning failed:', insertError.message)
        }
      }

      return redirectTo('/dashboard/organizer')
    }

    return redirectTo(next)
  }

  return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', origin))
}