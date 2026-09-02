import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'

  // Open-redirect guard: only allow same-site relative paths.
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\')
      ? rawNext
      : '/'

  const supabase = await createClient()

  // Two entry paths share the same provisioning:
  //  a) OAuth / email-link: exchange ?code for a session first.
  //  b) Password signup with confirmation off: the client already holds a
  //     session and is redirected here without a code.
  let user: User | null = null
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.code)
    } else {
      user = data.user
    }
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
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
    let role = (profile?.role as string | undefined) ?? (user.user_metadata?.role as string | undefined)

    // If no role anywhere, prompt user to select one
    if (!role) {
      const rawNext = searchParams.get('next') ?? '/'
      const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'
      return NextResponse.redirect(new URL(`/auth/role?next=${encodeURIComponent(next)}`, origin))
    }

    if (role === 'system_admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', origin))
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

      return NextResponse.redirect(new URL('/dashboard/restaurant', origin))
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

      return NextResponse.redirect(new URL('/dashboard/organizer', origin))
    }

    return NextResponse.redirect(new URL(next, origin))
  }

  return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', origin))
}
