'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, DollarSign, Ticket, Users } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({ events: 0, tickets: 0, revenue: 0, attendees: 0 })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: organizer } = await supabase
        .from('organizers').select('id').eq('owner_id', user.id).maybeSingle()
      if (!organizer) return

      const { count: events } = await supabase
        .from('events').select('*', { count: 'exact', head: true }).eq('organizer_id', organizer.id)

      const { data: eventIds } = await supabase
        .from('events').select('id').eq('organizer_id', organizer.id)
      const ids = eventIds?.map(e => e.id) ?? []

      const { count: purchases } = ids.length > 0
        ? await supabase.from('ticket_purchases').select('*', { count: 'exact', head: true }).in('event_id', ids)
        : { count: 0 }

      setMetrics({
        events: events ?? 0,
        tickets: purchases ?? 0,
        revenue: 0,
        attendees: 0,
      })
    }
    load()
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Organizer</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Analytics</h1>
      <p className="mt-2 text-sm text-app-muted">Track your event performance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Events" value={metrics.events} icon={<CalendarDays className="size-5" />} />
        <MetricCard title="Tickets Sold" value={metrics.tickets} icon={<Ticket className="size-5" />} />
        <MetricCard title="Revenue" value={`$${metrics.revenue}`} icon={<DollarSign className="size-5" />} />
        <MetricCard title="Attendees" value={metrics.attendees} icon={<Users className="size-5" />} />
      </div>
    </div>
  )
}
