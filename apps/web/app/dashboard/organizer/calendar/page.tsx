'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CalendarEvent = {
  id: string
  title: string
  starts_at: string
  endDateTime: string
  status: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

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
        .order('startDateTime', { ascending: true })
      if (data) setEvents(data)
      setLoading(false)
    }
    load()
  }, [])

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    const date = new Date(e.starts_at).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(e)
    return acc
  }, {})

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-ember">Organizer</p>
      <h1 className="mt-2  text-3xl font-bold text-app-fg">Calendar</h1>
      <p className="mt-2 text-sm text-app-muted">View your events by date.</p>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--bg-input)]" />)}
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold text-app-fg">{date}</h3>
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                    <div>
                      <p className="font-medium text-app-fg">{e.title}</p>
                      <p className="text-xs text-app-muted">{new Date(e.starts_at).toLocaleTimeString()}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      e.status === 'PUBLISHED' ? 'bg-success/15 text-success' :
                      e.status === 'DRAFT' ? 'bg-app-input text-app-muted' :
                      'bg-ember/12 text-ember'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="py-12 text-center text-app-muted">No events scheduled.</p>
          )}
        </div>
      )}
    </div>
  )
}
