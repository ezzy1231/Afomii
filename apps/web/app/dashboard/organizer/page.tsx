import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, CircleDollarSign, Store } from 'lucide-react'
import EventListingForm from '@/components/dashboard/EventListingForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Organizer Dashboard' }

export default async function OrganizerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user!.id)
    .maybeSingle()
  const profile = profileData ?? null

  const { data: organizerRaw } = await supabase
    .from('organizers')
    .select('id, name')
    .eq('owner_id', profile?.id ?? '')
    .maybeSingle()

  // Self-heal: accounts from before provisioning ran through the callback get
  // their organizers row created on first dashboard view.
  let organizer = organizerRaw
  if (!organizer && profile) {
    const metaRole =
      (user!.user_metadata as Record<string, unknown> | undefined)?.role ?? profile.role
    if (metaRole === 'event_organizer') {
      const { ensureOrganizer } = await import('@/lib/provision')
      organizer = await ensureOrganizer(supabase, {
        id: profile.id,
        email: profile.email ?? user!.email,
        user_metadata: (user!.user_metadata as Record<string, unknown> | undefined) ?? undefined,
      })
    }
  }

  const { data: events } = organizer
    ? await supabase
        .from('events')
        .select('id,title,category,venue_name,starts_at,is_active,created_at')
        .eq('organizer_id', organizer.id)
        .order('created_at', { ascending: false })
        .limit(24)
    : { data: [] }

  const eventIds = (events ?? []).map((e) => e.id)
  let ticketsSold = 0
  let revenue = 0
  let attendees = 0
  if (eventIds.length) {
    const { data: purchases } = await supabase
      .from('ticket_purchases')
      .select('quantity, amount, attended')
      .in('event_id', eventIds)
    for (const p of purchases ?? []) {
      ticketsSold += Number(p.quantity) || 0
      revenue += Number(p.amount) || 0
      if (p.attended) attendees += 1
    }
  }

  // An event with no tier cannot sell a ticket. Flag those rather than letting
  // an unsellable event sit in the list looking healthy.
  const tierCounts = new Map<string, number>()
  if (eventIds.length) {
    const { data: tiers } = await supabase
      .from('ticket_types')
      .select('event_id')
      .in('event_id', eventIds)
    for (const t of tiers ?? []) {
      tierCounts.set(t.event_id, (tierCounts.get(t.event_id) ?? 0) + 1)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-ember">Partner portal</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className=" text-3xl font-bold text-app-fg">Organizer workspace</h1>
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
        <Metric icon={Store} label="Tickets sold" value={String(ticketsSold)} />
        <Metric icon={CircleDollarSign} label="Revenue" value={`ETB ${revenue}`} />
      </div>

      {!organizer && (
        <section className="animate-pop-in mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-app-fg">
          No linked organizer profile was found for your account. Complete organizer signup first.
        </section>
      )}

      {organizer && (
        <section className="mt-6">
          <EventListingForm />
        </section>
      )}

      <section className="card-elevated mt-6 p-6">
        <h2 className=" text-xl font-bold text-app-fg">Your events</h2>
        <p className="mt-2 text-sm text-app-muted">Recently published events from your workspace.</p>

        {events?.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {events.map((item) => (
              <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-app-fg">{item.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.is_active ? 'bg-success/15 text-success' : 'bg-app-input text-app-muted'}`}>
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
                {!tierCounts.get(item.id) && (
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-bold uppercase tracking-wider text-warning">
                      No tickets
                    </span>
                    <Link
                      href="/dashboard/organizer/tickets"
                      className="font-semibold text-ember underline underline-offset-2"
                    >
                      Add a ticket tier
                    </Link>
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
      <div className="w-9 h-9 rounded-xl bg-ember/10 flex items-center justify-center">
        <Icon className="size-4 text-ember" />
      </div>
      <p className="mt-4 text-2xl font-bold text-app-fg">{value}</p>
      <p className="mt-1 text-sm text-app-muted">{label}</p>
    </section>
  )
}
