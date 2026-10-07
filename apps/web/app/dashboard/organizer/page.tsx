import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ConsolePageShell,
  ConsoleHeader,
  ConsoleKpiCard,
  SectionTitle,
  Sparkline,
} from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Organizer Dashboard' }

const CHART_DAYS = 30
const EVENTS_LIMIT = 200

type EventRow = {
  id: string
  title: string
  category: string | null
  venue_name: string | null
  starts_at: string | null
  cover_image_url: string | null
  status: string | null
  is_active: boolean | null
}

type TierRow = {
  event_id: string
  total_quantity: number | null
  remaining_quantity: number | null
}

type PurchaseRow = {
  event_id: string
  quantity: number | null
  amount: number | null
  payment_status: string | null
  attended: boolean | null
  created_at: string
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

function utcDay(offsetDays: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function formatETB(value: number): string {
  return `ETB ${value.toLocaleString('en-US')}`
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

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

  const { data: eventsData } = organizer
    ? await supabase
        .from('events')
        .select('id,title,category,venue_name,starts_at,cover_image_url,status,is_active')
        .eq('organizer_id', organizer.id)
        .order('created_at', { ascending: false })
        .limit(EVENTS_LIMIT)
    : { data: [] }

  const events = (eventsData ?? []) as EventRow[]
  const eventIds = events.map((e) => e.id)

  const { data: tiersData } = eventIds.length
    ? await supabase
        .from('ticket_types')
        .select('event_id, total_quantity, remaining_quantity')
        .in('event_id', eventIds)
    : { data: [] }
  const tiers = (tiersData ?? []) as TierRow[]

  const chartStart = utcDay(-(CHART_DAYS - 1))
  const { data: purchasesData } = eventIds.length
    ? await supabase
        .from('ticket_purchases')
        .select('event_id, quantity, amount, payment_status, attended, created_at')
        .in('event_id', eventIds)
        .gte('created_at', `${chartStart}T00:00:00.000Z`)
        .limit(10000)
    : { data: [] }
  const purchases = (purchasesData ?? []) as PurchaseRow[]

  // Only settled money counts as revenue. The Analytics tab applies the same
  // filter, so both tabs must report the same number.
  const ticketsSold = purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)
  const paidRevenue = purchases
    .filter((p) => p.payment_status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const totalCapacity = tiers.reduce((sum, t) => sum + (Number(t.total_quantity) || 0), 0)
  const remainingCapacity = tiers.reduce((sum, t) => sum + (Number(t.remaining_quantity) || 0), 0)
  const soldFromCapacity = totalCapacity - remainingCapacity
  const sellThrough =
    totalCapacity > 0 ? Math.round((soldFromCapacity / totalCapacity) * 100) : 0

  const liveEvents = events.filter((e) => e.is_active !== false && e.status === 'published')

  // Daily ticket series for the overview chart
  const daily = new Map<string, number>()
  for (let i = 0; i < CHART_DAYS; i++) daily.set(utcDay(i - (CHART_DAYS - 1)), 0)
  for (const p of purchases) {
    const key = dayKey(p.created_at)
    if (daily.has(key)) daily.set(key, (daily.get(key) ?? 0) + (Number(p.quantity) || 0))
  }
  const seriesPoints = Array.from(daily.values())
  const hasSales = ticketsSold > 0

  // Per-event rollup used by the health checks and the "coming up" list
  const tiersByEvent = new Map<string, TierRow[]>()
  for (const t of tiers) {
    const list = tiersByEvent.get(t.event_id) ?? []
    list.push(t)
    tiersByEvent.set(t.event_id, list)
  }

  type Issue = {
    key: string
    title: string
    detail: string
    href: string
    action: string
    tone: 'warning' | 'danger' | 'info'
  }
  const issues: Issue[] = []

  for (const event of events) {
    const eventTiers = tiersByEvent.get(event.id) ?? []
    if (eventTiers.length === 0) {
      issues.push({
        key: `tiers-${event.id}`,
        title: event.title,
        detail: 'Has no ticket tier, so nobody can buy a ticket.',
        href: '/dashboard/organizer/tickets',
        action: 'Add a tier',
        tone: 'danger',
      })
    }
    if (event.is_active === false) {
      issues.push({
        key: `hidden-${event.id}`,
        title: event.title,
        detail: 'Unpublished, so it is hidden from the discover feed.',
        href: '/dashboard/organizer/events',
        action: 'Manage',
        tone: 'warning',
      })
    }
    if (!event.starts_at) {
      issues.push({
        key: `date-${event.id}`,
        title: event.title,
        detail: 'No start date set, so it will not appear on your calendar.',
        href: '/dashboard/organizer/events',
        action: 'Manage',
        tone: 'warning',
      })
    }
    if (!event.cover_image_url) {
      issues.push({
        key: `banner-${event.id}`,
        title: event.title,
        detail: 'No banner image, so it renders without a cover.',
        href: '/dashboard/organizer/events',
        action: 'Manage',
        tone: 'info',
      })
    }
  }

  if (!organizer) {
    issues.unshift({
      key: 'no-organizer',
      title: 'No linked organizer profile',
      detail: 'Your account is not connected to an organizer, so events cannot be created.',
      href: '/settings',
      action: 'Account settings',
      tone: 'danger',
    })
  } else if (events.length === 0) {
    issues.unshift({
      key: 'no-events',
      title: 'No events yet',
      detail: 'Create your first event to start selling tickets.',
      href: '/dashboard/organizer/events/new',
      action: 'Create event',
      tone: 'info',
    })
  }

  const toneClass: Record<Issue['tone'], string> = {
    danger: 'border-danger/30 bg-danger/8',
    warning: 'border-warning/30 bg-warning/8',
    info: 'border-app-border bg-app-elevated/50',
  }
  const dotClass: Record<Issue['tone'], string> = {
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-ember',
  }
  const visibleIssues = issues.slice(0, 5)
  const hiddenIssueCount = issues.length - visibleIssues.length

  const nowMs = Date.now()
  const comingUp = events
    .filter((e) => e.starts_at && new Date(e.starts_at).getTime() >= nowMs)
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
    .slice(0, 4)
    .map((e) => {
      const eventTiers = tiersByEvent.get(e.id) ?? []
      const remaining = eventTiers.reduce((sum, t) => sum + (Number(t.remaining_quantity) || 0), 0)
      return { event: e, remaining }
    })

  const kpis = [
    { label: 'Live events', value: String(liveEvents.length), accent: true },
    { label: 'Tickets sold', value: String(ticketsSold), accent: false },
    { label: 'Paid revenue', value: formatETB(paidRevenue), accent: false },
    { label: 'Sell-through', value: totalCapacity > 0 ? `${sellThrough}%` : '—', accent: false },
  ]

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Partner portal"
        title="Organizer workspace"
        subtitle="How your events are performing across UrbanExplore."
        action={
          <Link
            href="/dashboard/organizer/events/new"
            className="btn-primary inline-flex !py-2.5 text-sm"
          >
            ＋ Create event
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <ConsoleKpiCard key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} />
        ))}
      </section>

      {/* Overview chart. Analytics owns the deep dive; this is the glance. */}
      <section className="space-y-3">
        <SectionTitle>Tickets sold · last {CHART_DAYS} days</SectionTitle>
        <div className={cn(CONSOLE_CARD, 'p-5')}>
          {hasSales ? (
            <>
              <p className="mb-4 text-xs uppercase tracking-widest text-app-muted">
                Tickets per day · {ticketsSold} total
              </p>
              <Sparkline
                points={seriesPoints}
                label={`Tickets sold per day over the last ${CHART_DAYS} days`}
              />
            </>
          ) : (
            <div className="border-dashed py-10 text-center">
              <p className="font-semibold">No ticket sales in the last {CHART_DAYS} days</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-app-muted">
                Publish an event and add a ticket tier — sales will chart here as they come in.
              </p>
              <Link
                href="/dashboard/organizer/events/new"
                className="mt-4 inline-block min-h-[44px] rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-on-accent shadow-glass transition-all hover:brightness-110"
              >
                Create an event
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Health checks */}
      <section className="space-y-3">
        <SectionTitle>Needs attention</SectionTitle>
        {visibleIssues.length === 0 ? (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="font-semibold">Everything checks out</p>
            <p className="mt-1 text-sm text-app-muted">
              Every event is published, dated and sellable.
            </p>
          </div>
        ) : (
          <>
            <ul className={cn(CONSOLE_CARD, 'divide-y divide-app-border')}>
              {visibleIssues.map((issue) => (
                <li
                  key={issue.key}
                  className={cn('flex flex-wrap items-center gap-3 px-4 py-3.5', toneClass[issue.tone])}
                >
                  <span
                    aria-hidden
                    className={cn('size-2 shrink-0 rounded-full', dotClass[issue.tone])}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{issue.title}</p>
                    <p className="truncate text-xs text-app-muted">{issue.detail}</p>
                  </div>
                  <Link
                    href={issue.href}
                    className="min-h-[36px] shrink-0 rounded-full border border-app-border px-3.5 py-1.5 text-xs font-semibold text-app-muted transition-colors hover:border-ember/30 hover:text-app-fg"
                  >
                    {issue.action}
                  </Link>
                </li>
              ))}
            </ul>
            {hiddenIssueCount > 0 && (
              <p className="px-1 text-xs text-app-muted">
                + {hiddenIssueCount} more from your other events.{' '}
                <Link
                  href="/dashboard/organizer/events"
                  className="font-semibold text-ember underline underline-offset-2"
                >
                  Review all events
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      {/* Upcoming schedule. Management of events lives in the Events tab. */}
      <section className="space-y-3">
        <SectionTitle>Coming up</SectionTitle>
        {comingUp.length === 0 ? (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-app-muted">
              No dated events ahead. Set a start date and your schedule fills in here.
            </p>
          </div>
        ) : (
          <ul className={cn(CONSOLE_CARD, 'divide-y divide-app-border')}>
            {comingUp.map(({ event, remaining }) => (
              <li key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{event.title}</p>
                  <p className="truncate text-xs text-app-muted">
                    {[event.venue_name, event.category].filter(Boolean).join(' · ') ||
                      'No venue set'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-ember">
                    {formatEventDate(event.starts_at!)}
                  </p>
                  <p className="text-xs text-app-muted tabular-nums">
                    {remaining > 0 ? `${remaining} tickets left` : 'Sold out'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ConsolePageShell>
  )
}