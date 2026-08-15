'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, DollarSign, Store, Users } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'

export default function RestaurantAnalyticsPage() {
  const [metrics, setMetrics] = useState({ listings: 0, bookings: 0, guests: 0, views: 0 })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: business } = await supabase
        .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
      if (!business) return

      const { count: listings } = await supabase
        .from('restaurants').select('*', { count: 'exact', head: true }).eq('business_id', business.id)

      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('business_id', business.id)

      const branchIds = branches ?? []
      let bookings = 0
      let guests = 0
      if (branchIds.length) {
        const { data: rows } = await supabase
          .from('reservations')
          .select('guest_count')
          .in('branch_id', branchIds.map((b: any) => b.id))
        bookings = rows?.length ?? 0
        guests = (rows ?? []).reduce((sum: number, r: any) => sum + (Number(r.guest_count) || 0), 0)
      }

      setMetrics({ listings: listings ?? 0, bookings, guests, views: 0 })
    }
    load()
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Restaurant</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Analytics</h1>
      <p className="mt-2 text-sm text-app-muted">Track your restaurant performance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Listings" value={metrics.listings} icon={<Store className="size-5" />} />
        <MetricCard title="Bookings" value={metrics.bookings} icon={<CalendarDays className="size-5" />} />
        <MetricCard title="Guests" value={metrics.guests} icon={<Users className="size-5" />} />
        <MetricCard title="Profile Views" value={metrics.views} icon={<DollarSign className="size-5" />} />
      </div>
    </div>
  )
}
