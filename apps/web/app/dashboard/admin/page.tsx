import { createClient } from '@/lib/supabase/server'
import { Users, Store, CalendarDays, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const { count: userCount } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })

  const { count: businessCount } = await supabase
    .from('businesses').select('*', { count: 'exact', head: true })

  const { count: eventCount } = await supabase
    .from('events').select('*', { count: 'exact', head: true })

  const { count: restaurantCount } = await supabase
    .from('restaurants').select('*', { count: 'exact', head: true })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Admin</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-app-muted">Platform overview and management.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Users" value={userCount ?? 0} />
        <StatCard icon={Store} label="Businesses" value={businessCount ?? 0} />
        <StatCard icon={CalendarDays} label="Events" value={eventCount ?? 0} />
        <StatCard icon={TrendingUp} label="Restaurants" value={restaurantCount ?? 0} />
      </div>

      <section className="card-elevated mt-8 p-6">
        <h2 className="font-serif text-xl font-bold text-app-fg">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <a href="/dashboard/admin/users" className="btn-secondary text-center !py-3">Manage Users</a>
          <a href="/dashboard/admin/businesses" className="btn-secondary text-center !py-3">Manage Businesses</a>
          <a href="/dashboard/admin/events" className="btn-secondary text-center !py-3">Manage Events</a>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <section className="card-elevated p-5">
      <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
        <Icon className="size-4 text-gold" />
      </div>
      <p className="mt-4 text-2xl font-bold text-app-fg">{value}</p>
      <p className="mt-1 text-sm text-app-muted">{label}</p>
    </section>
  )
}
