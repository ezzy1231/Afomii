import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Minimal session summary for the shared chrome (header, footer).
 *
 * Exists so the header does not have to be a server component that reads
 * cookies — doing that opted every public page out of static rendering. It is
 * also deliberately cheaper than shipping @supabase/supabase-js to the client
 * just to answer "is anyone signed in?": that library is ~213 kB raw and would
 * land in the shared bundle for pages like /about and /terms that otherwise need
 * almost no JavaScript at all.
 *
 * Never cached — it is per-user.
 */
export async function GET() {
  const noStore = { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Anonymous is the common case: one auth call, no further queries.
    if (!user) {
      return NextResponse.json({ authenticated: false }, { headers: noStore })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .maybeSingle()

    const profileId = profile?.id ?? null
    const name = profile?.full_name ?? profile?.email ?? user.email ?? null

    let unread = 0
    if (profileId) {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profileId)
        .is('read_at', null)
      unread = count ?? 0
    }

    return NextResponse.json(
      {
        authenticated: true,
        profileId,
        initial: name ? String(name).charAt(0).toUpperCase() : 'U',
        unread,
      },
      { headers: noStore }
    )
  } catch {
    // Never take the header down over a session lookup.
    return NextResponse.json({ authenticated: false }, { headers: noStore })
  }
}
