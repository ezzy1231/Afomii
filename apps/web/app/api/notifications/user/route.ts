import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Current user's recent notifications + unread count (used by the bell). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ notifications: [], unread: 0 }, { status: 401 })
  }

  const [notifRes, countRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, type, title, body, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  const notifications = (notifRes.data ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? '',
    readAt: n.read_at ?? null,
    createdAt: n.created_at,
  }))

  return NextResponse.json({
    notifications,
    unread: countRes.count ?? 0,
  })
}
