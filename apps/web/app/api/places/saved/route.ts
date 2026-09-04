import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export type SavedPlace = {
  id: string
  name: string
  category: string
  location: string
  detail: string
  rating: string
  imageUrl: string | null
}

/**
 * Hydrate the client's locally-saved place ids into full listings.
 * Saved ids live in the browser's localStorage (`afomii.saved`); this route
 * resolves them against public restaurant rows so the Saved tab can render
 * real cards. Only public columns are returned, so no auth is required.
 */
export async function POST(request: Request) {
  let ids: string[] = []
  try {
    const body = await request.json()
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((v: unknown): v is string => typeof v === 'string').slice(0, 100)
    }
  } catch {
    // malformed body → empty ids
  }

  if (ids.length === 0) {
    return NextResponse.json({ places: [] })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, cuisine, city, area_label, rating, cover_url, closing_label')
      .in('id', ids)
      .eq('is_active', true)

    if (error) {
      console.error('[places/saved] hydrate failed:', error.message)
      return NextResponse.json({ places: [] })
    }

    // Preserve the client's saved order (most recent first in the list).
    const byId = new Map((data ?? []).map((r: any) => [r.id, r]))
    const places: SavedPlace[] = ids
      .map((id) => byId.get(id))
      .filter((r): r is any => Boolean(r))
      .map((r) => ({
        id: r.id,
        name: r.name,
        category: r.cuisine ?? 'Restaurant',
        location: r.area_label ?? r.city ?? 'City center',
        detail: r.closing_label ?? 'Open today',
        rating: r.rating != null ? String(r.rating) : 'New',
        imageUrl: r.cover_url ?? null,
      }))

    return NextResponse.json({ places })
  } catch (err) {
    console.error('[places/saved] hydrate crashed:', err)
    return NextResponse.json({ places: [] })
  }
}
