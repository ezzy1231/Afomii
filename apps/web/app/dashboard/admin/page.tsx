import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Building2, Store, Users, UserRoundCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ConsoleAreaChart } from '@/components/dashboard/console-area-chart'
import { ConsolePageShell, ConsoleHeader, SectionTitle, StatusPill } from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { BusinessVerificationActions } from '@/components/dashboard/business-verification-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin Console' }

type DirectoryRow = { id: string; name: string; role: string; status: string }
type PendingBusiness = { id: string; name: string; created_at: string | null }

function relativeTime(iso: string | null): string {
  if (!iso) return 'recently'
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`
  return `${Math.round(minutes / 1440)}d ago`
}

function auditPrefix(action: string): '[OK]' | '[WARN]' | '[INFO]' {
  if (/rejected|suspend|cancel/.test(action)) return '[WARN]'
  if (/approved|verified|confirm/.test(action)) return '[OK]'
  return '[INFO]'
}

function dailySignupSeries(timestamps: string[]) {
  const now = new Date()
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - index))
    date.setHours(0, 0, 0, 0)
    return date
  })
  const counts = new Map(days.map((date) => [date.toISOString().slice(0, 10), 0]))
  for (const timestamp of timestamps) {
    const day = timestamp.slice(0, 10)
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return days.map((date) => ({
    label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: counts.get(date.toISOString().slice(0, 10)) ?? 0,
  }))
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = (searchParams?.q ?? '').trim()
  const supabase = await createClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [usersRes, businessesRes, organizersRes, listingsRes, recentUsersRes, recentBusinessesRes, recentOrganizersRes, recentListingsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('organizers').select('id', { count: 'exact', head: true }),
    supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('businesses').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('organizers').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', since),
  ])

  let pendingQuery = supabase
    .from('businesses')
    .select('id, name, created_at', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(8)
  if (q) pendingQuery = pendingQuery.ilike('name', `%${q}%`)
  const pendingRes = await pendingQuery

  let businessDirQuery = supabase.from('businesses').select('id, name, status').order('created_at', { ascending: false }).limit(6)
  let organizerDirQuery = supabase.from('organizers').select('id, name, status').order('created_at', { ascending: false }).limit(4)
  if (q) {
    businessDirQuery = businessDirQuery.ilike('name', `%${q}%`)
    organizerDirQuery = organizerDirQuery.ilike('name', `%${q}%`)
  }
  const [bizDirRes, orgDirRes, auditRes, chartRes] = await Promise.all([
    businessDirQuery,
    organizerDirQuery,
    supabase.from('audit_logs').select('id, actor_id, action, entity_type, created_at').order('created_at', { ascending: false }).limit(12),
    supabase.from('profiles').select('created_at').gte('created_at', since).order('created_at', { ascending: true }).limit(5000),
  ])

  const pendingRows = (pendingRes.data ?? []) as PendingBusiness[]
  const directory: DirectoryRow[] = [
    ...((bizDirRes.data ?? []) as Array<{ id: string; name: string; status: string }>).map((row) => ({ ...row, role: 'Business' })),
    ...((orgDirRes.data ?? []) as Array<{ id: string; name: string; status: string }>).map((row) => ({ ...row, role: 'Organizer' })),
  ]
  const auditRows = (auditRes.data ?? []) as Array<{ id: string; actor_id: string | null; action: string; entity_type: string | null; created_at: string }>
  const actorIds = Array.from(new Set(auditRows.map((row) => row.actor_id).filter((id): id is string => Boolean(id))))
  const actorsRes = actorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] }
  const actorNames = new Map(((actorsRes.data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>).map((actor) => [actor.id, actor.full_name || actor.email || 'system']))

  const kpis = [
    { label: 'Total users', value: usersRes.count, added: recentUsersRes.count, Icon: Users, tone: 'bg-console-indigo-soft text-console-indigo' },
    { label: 'Businesses', value: businessesRes.count, added: recentBusinessesRes.count, Icon: Building2, tone: 'bg-console-sand text-console-sand-ink' },
    { label: 'Organizers', value: organizersRes.count, added: recentOrganizersRes.count, Icon: UserRoundCheck, tone: 'bg-console-sky text-console-sky-ink' },
    { label: 'Active listings', value: listingsRes.count, added: recentListingsRes.count, Icon: Store, tone: 'bg-console-mint text-console-mint-ink' },
  ]

  return (
    <ConsolePageShell maxWidth="max-w-7xl">
      <ConsoleHeader eyebrow="Operations" title="Overview" subtitle="Platform activity and items requiring attention." />

      <section aria-label="Platform totals" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, added, Icon, tone }) => (
          <div key={label} className={cn(CONSOLE_CARD, 'flex min-h-28 items-center gap-3 p-4')}>
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone)}><Icon size={18} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-app-muted">{label}</p>
              <p className="text-2xl font-bold tabular-nums text-app-fg">{value ?? '—'}</p>
              <p className="text-[11px] text-app-muted"><span aria-hidden="true">↑ +</span><span className="sr-only">Up, plus </span>{added ?? 0} in last 30 days</p>
            </div>
          </div>
        ))}
      </section>

      <ConsoleAreaChart
        title="New user signups"
        unit="users"
        series={{ 'Last 30 days': dailySignupSeries(((chartRes.data ?? []) as Array<{ created_at: string }>).map((row) => row.created_at)) }}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Pending verification</SectionTitle>
          <span className="text-xs font-semibold tabular-nums text-app-muted">{pendingRes.count ?? '—'} awaiting review</span>
        </div>
        {pendingRes.error ? (
          <div role="alert" className={cn(CONSOLE_CARD, 'p-4 text-sm text-danger')}>Could not load verification requests. <Link href="/dashboard/admin/businesses" className="underline">Retry</Link></div>
        ) : pendingRows.length > 0 ? (
          <div className="divide-y divide-app-border rounded-xl border border-app-border bg-app-card">
            {pendingRows.map((row) => (
              <div key={row.id} className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.name}</p>
                  <p className="text-xs text-app-muted">Submitted {relativeTime(row.created_at)}</p>
                </div>
                <BusinessVerificationActions businessId={row.id} />
              </div>
            ))}
            {(pendingRes.count ?? 0) > pendingRows.length && <Link href="/dashboard/admin/businesses?status=pending" className="flex min-h-11 items-center justify-center text-sm font-semibold text-ember hover:underline">View all {pendingRes.count} requests <ArrowUpRight className="ml-1 size-4" /></Link>}
          </div>
        ) : (
          <div className={cn(CONSOLE_CARD, 'p-5 text-sm text-app-muted')}>No businesses are waiting for verification.</div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><SectionTitle>Directory</SectionTitle><div className="flex gap-3 text-xs font-semibold text-ember"><Link href="/dashboard/admin/businesses" className="hover:underline">All businesses</Link><Link href="/dashboard/admin/organizers" className="hover:underline">All organizers</Link></div></div>
        <p className="text-xs text-app-muted">Showing the latest 10 matching businesses and organizers.</p>
        <form method="get" className={cn(CONSOLE_CARD, 'flex items-center gap-3 px-3 py-2')}>
          <label htmlFor="directory-search" className="sr-only">Search entities</label>
          <input id="directory-search" type="search" name="q" defaultValue={q} placeholder="Search entities…" className="min-h-10 w-full bg-transparent text-sm text-app-fg outline-none placeholder:text-app-muted" />
          <button className="min-h-10 rounded-lg bg-ember px-4 text-xs font-semibold text-on-accent">Search</button>
        </form>
        {bizDirRes.error || orgDirRes.error ? (
          <div role="alert" className={cn(CONSOLE_CARD, 'p-4 text-sm text-danger')}>Could not load the directory. <Link href="/dashboard/admin" className="underline">Retry</Link></div>
        ) : (
          <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Recent businesses and organizers</caption>
              <thead><tr className="border-b border-app-border text-xs text-app-muted"><th scope="col" className="px-3 py-2.5 font-semibold">Name</th><th scope="col" className="px-3 py-2.5 font-semibold">Type</th><th scope="col" className="px-3 py-2.5 font-semibold">Status</th></tr></thead>
              <tbody>{directory.length ? directory.map((row) => <tr key={`${row.role}-${row.id}`} className="border-b border-app-border last:border-0"><td className="max-w-[340px] truncate px-3 py-2 font-medium">{row.name}</td><td className="px-3 py-2 text-app-muted">{row.role}</td><td className="px-3 py-2"><StatusPill status={row.status} tone={statusTone(row.status)} /></td></tr>) : <tr><td colSpan={3} className="px-3 py-8 text-center text-sm text-app-muted">No entities match “{q}”.</td></tr>}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><SectionTitle>Audit activity</SectionTitle><Link href="/dashboard/admin/audit" className="text-xs font-semibold text-ember hover:underline">Full audit log</Link></div>
        {auditRes.error || actorsRes.data === null ? <div role="alert" className={cn(CONSOLE_CARD, 'p-4 text-sm text-danger')}>Could not load audit activity. <Link href="/dashboard/admin/audit" className="underline">Retry</Link></div> : (
          <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Latest administrative activity</caption>
              <thead><tr className="border-b border-app-border text-app-muted"><th scope="col" className="px-3 py-2 font-semibold">Action</th><th scope="col" className="px-3 py-2 font-semibold">Actor</th><th scope="col" className="px-3 py-2 font-semibold">Entity</th><th scope="col" className="px-3 py-2 font-semibold">Time</th></tr></thead>
              <tbody>{auditRows.length ? auditRows.map((row) => <tr key={row.id} className="border-b border-app-border last:border-0"><td className="px-3 py-2 font-mono"><span className="mr-2 text-app-muted">{auditPrefix(row.action)}</span>{row.action}</td><td className="px-3 py-2">{actorNames.get(row.actor_id ?? '') ?? 'system'}</td><td className="px-3 py-2 font-mono text-app-muted">{row.entity_type ?? '—'}</td><td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-app-muted">{relativeTime(row.created_at)}</td></tr>) : <tr><td colSpan={4} className="px-3 py-8 text-center text-app-muted">No admin activity recorded yet.</td></tr>}</tbody>
            </table>
          </div>
        )}
      </section>
    </ConsolePageShell>
  )
}
