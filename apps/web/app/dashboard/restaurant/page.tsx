import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, CircleDollarSign, Store } from 'lucide-react'
import RestaurantListingForm from '@/components/dashboard/RestaurantListingForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Restaurant Dashboard' }

export default async function RestaurantDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: listings } = business
    ? await supabase
        .from('restaurants')
        .select('id,name,cuisine,city,area_label,is_active,created_at')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(24)
    : { data: [] }

  const { data: branches } = business
    ? await supabase.from('branches').select('id').eq('business_id', business.id)
    : { data: [] }
  const branchIds = (branches ?? []).map((b) => b.id)

  let upcomingBookings = 0
  let totalGuests = 0
  if (branchIds.length) {
    const { data: resRows } = await supabase
      .from('reservations')
      .select('reservation_date, status, guest_count')
      .in('branch_id', branchIds)
      .limit(2000)
    const today = new Date().toISOString().slice(0, 10)
    for (const r of resRows ?? []) {
      if ((r.status === 'confirmed' || r.status === 'pending') && r.reservation_date >= today) {
        upcomingBookings += 1
      }
      totalGuests += Number(r.guest_count) || 0
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Partner portal</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl font-bold text-app-fg">Restaurant workspace</h1>
          <p className="mt-2 text-app-muted">
            Manage your public restaurant catalogue listing and attract new guests.
          </p>
        </div>
        <Link href="/settings" className="btn-secondary !py-2.5 text-sm text-center !text-app-fg">
          Account settings
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric icon={Store} label="Published restaurants" value={String(listings?.length ?? 0)} />
        <Metric icon={CalendarDays} label="Upcoming bookings" value={String(upcomingBookings)} />
        <Metric icon={CircleDollarSign} label="Total guests served" value={String(totalGuests)} />
      </div>

      {!business && (
        <section className="animate-pop-in mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-app-fg">
          No linked business profile was found for your account. Complete business signup first.
        </section>
      )}

      {business && (
        <section className="mt-6">
          <RestaurantListingForm />
        </section>
      )}

      <section className="card-elevated mt-6 p-6">
        <h2 className="font-serif text-xl font-bold text-app-fg">Your listings</h2>
        <p className="mt-2 text-sm text-app-muted">Recent listings created from your workspace.</p>

        {listings?.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {listings.map((item) => (
              <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-app-fg">{item.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.is_active ? 'bg-success/15 text-success' : 'bg-app-input text-app-muted'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-app-muted">
                  {[item.cuisine, item.area_label ?? item.city].filter(Boolean).join(' · ') || 'No details yet'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-app-muted">No listings yet. Create your first one above.</p>
        )}
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
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
