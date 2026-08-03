import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const role = user.user_metadata?.role as string | undefined

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

          await supabase.from('businesses').insert({
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

          await supabase.from('organizers').insert({
            owner_id: user.id,
            org_name: rawName,
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
        }

        return NextResponse.redirect(new URL('/dashboard/organizer', origin))
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', origin))
}
