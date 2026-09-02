'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleEventActive } from '@/app/dashboard/actions'
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'

type EventItem = {
  id: string
  title: string
  category: string
  venue_name: string
  starts_at: string | null
  is_active: boolean
}

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleToggle(item: EventItem) {
    setBusyId(item.id)
    const res = await toggleEventActive(item.id, !item.is_active)
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, is_active: !e.is_active } : e))
      )
    }
    setBusyId(null)
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: organizer } = await supabase
        .from('organizers').select('id').eq('owner_id', user.id).maybeSingle()
      if (!organizer) { setLoading(false); return }

      const { data } = await supabase
        .from('events').select('*').eq('organizer_id', organizer.id)
        .order('created_at', { ascending: false }).limit(50)
      if (data) setEvents(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-ember">Organizer</p>
      <h1 className="mt-2  text-3xl font-bold text-app-fg">Events</h1>
      <p className="mt-2 text-sm text-app-muted">Manage your published and draft events.</p>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--bg-input)]" />)}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {events.map((item) => (
            <article key={item.id} className="card-elevated p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-app-fg">{item.title}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  item.is_active ? 'bg-success/15 text-success' : 'bg-app-input text-app-muted'
                }`}>
                  {item.is_active ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="mt-1 text-sm text-app-muted">{item.category}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-app-muted">
                <span className="flex items-center gap-1"><MapPin className="size-3" />{item.venue_name}</span>
                {item.starts_at && (
                  <span className="flex items-center gap-1"><CalendarDays className="size-3" />{new Date(item.starts_at).toLocaleDateString()}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleToggle(item)}
                disabled={busyId === item.id}
                className="mt-4 rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-app-fg transition hover:border-gold/50 disabled:opacity-50"
              >
                {busyId === item.id ? 'Updating…' : item.is_active ? 'Unpublish' : 'Publish'}
              </button>
            </article>
          ))}
          {events.length === 0 && (
            <div className="sm:col-span-2 py-12 text-center text-app-muted">
              <p>No events yet. Create your first event from the dashboard.</p>
              <Link href="/dashboard/organizer" className="btn-primary mt-4 inline-flex">Create event</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
