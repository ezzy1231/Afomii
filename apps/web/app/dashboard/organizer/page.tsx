import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, CircleDollarSign, Store } from 'lucide-react'
import EventListingForm from '@/components/dashboard/EventListingForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Organizer Dashboard' }

export default async function OrganizerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: organizer } = await supabase
    .from('organizers')
    .select('id, org_name')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: events } = organizer
    ? await supabase
        .from('events')
        .select('id,title,category,venue_name,starts_at,is_active,created_at')
        .eq('organizer_id', organizer.id)
        .order('created_at', { ascending: false })
        .limit(24)
    : { data: [] }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Partner portal</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl font-bold text-app-fg">Organizer workspace</h1>
          <p className="mt-2 text-app-muted">
            Create and manage events that appear in UrbanExplore discovery.
          </p>
        </div>
        <Link href="/settings" className="btn-secondary !py-2.5 text-sm text-center !text-app-fg">
          Account settings
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric icon={CalendarDays} label="Published events" value={String(events?.length ?? 0)} />
        <Metric icon={Store} label="Upcoming bookings" value="0" />
        <Metric icon={CircleDollarSign} label="This month" value="$0" />
      </div>

      {!organizer && (
        <section className="animate-pop-in mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          No linked organizer profile was found for your account. Complete organizer signup first.
        </section>
      )}

      {organizer && (
        <section className="mt-6">
          <EventListingForm />
        </section>
      )}

      <section className="card-elevated mt-6 p-6">
        <h2 className="font-serif text-xl font-bold text-app-fg">Your events</h2>
        <p className="mt-2 text-sm text-app-muted">Recently published events from your workspace.</p>

        {events?.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {events.map((item) => (
              <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-app-fg">{item.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-700'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-app-muted">
                  {[item.category, item.venue_name].filter(Boolean).join(' · ') || 'No details yet'}
                </p>
                {item.starts_at && (
                  <p className="mt-1 text-xs text-app-muted">
                    {new Date(item.starts_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-app-muted">No events yet. Create your first one above.</p>
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
