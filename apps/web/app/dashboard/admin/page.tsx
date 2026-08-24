import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  ConsoleKpiCard,
  SectionTitle,
  StatusPill,
  statusTone,
  CONSOLE_CARD,
} from '@/components/dashboard/console'
import { BusinessVerificationActions } from '@/components/dashboard/business-verification-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin Console' }

type PendingBusiness = {
  id: string
  name: string
  created_at: string | null
}

type DirectoryRow = {
  id: string
  name: string
  role: 'Food business' | 'Event organizer'
  status: string
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'recently'
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

function auditPrefix(action: string): '[OK]' | '[WARN]' | '[INFO]' {
  if (action.includes('rejected') || action.includes('suspend') || action.includes('cancel')) return '[WARN]'
  if (action.includes('approved') || action.includes('verified') || action.includes('confirm')) return '[OK]'
  return '[INFO]'
}

function initialsTile(name: string) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#4d5f7d]/30 bg-[#07192B] font-serif text-sm font-bold text-[#DFC391]">
      {initials || '?'}
    </span>
  )
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = (searchParams?.q ?? '').trim()

  const supabase = await createClient()

  const [usersRes, businessesRes, organizersRes, listingsRes, ticketsRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('organizers').select('id', { count: 'exact', head: true }),
    supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('ticket_purchases').select('amount').eq('payment_status', 'paid').limit(5000),
  ])

  const paidVolume = (ticketsRes.data ?? []).reduce(
    (sum: number, row: any) => sum + (Number(row.amount) || 0),
    0,
  )

  // Pending verification queue
  let pendingQuery = supabase
    .from('businesses')
    .select('id, name, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(8)
  if (q) pendingQuery = pendingQuery.ilike('name', `%${q}%`)
  const pendingRes = await pendingQuery

  // Directory — businesses + organizers, filtered by the shared search box
  let businessDirQuery = supabase
    .from('businesses')
    .select('id, name, status')
    .order('created_at', { ascending: false })
    .limit(q ? 12 : 6)
  let organizerDirQuery = supabase
    .from('organizers')
    .select('id, name, status')
    .order('created_at', { ascending: false })
    .limit(q ? 8 : 4)
  if (q) {
    businessDirQuery = businessDirQuery.ilike('name', `%${q}%`)
    organizerDirQuery = organizerDirQuery.ilike('name', `%${q}%`)
  }
  const [bizDirRes, orgDirRes] = await Promise.all([businessDirQuery, organizerDirQuery])

  const directory: DirectoryRow[] = [
    ...((bizDirRes.data ?? []) as Array<{ id: string; name: string; status: string }>).map((b) => ({
      id: b.id,
      name: b.name,
      role: 'Food business' as const,
      status: b.status,
    })),
    ...((orgDirRes.data ?? []) as Array<{ id: string; name: string; status: string }>).map((o) => ({
      id: o.id,
      name: o.name,
      role: 'Event organizer' as const,
      status: o.status,
    })),
  ]

  const auditRes = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, created_at')
    .order('created_at', { ascending: false })
    .limit(12)

  const pendingRows = (pendingRes.data ?? []) as PendingBusiness[]
  const kpis = [
    { label: 'Total users', value: String(usersRes.count ?? 0), accent: false },
    { label: 'Businesses', value: String(businessesRes.count ?? 0), accent: false },
    { label: 'Organizers', value: String(organizersRes.count ?? 0), accent: false },
    { label: 'Active listings', value: String(listingsRes.count ?? 0), accent: false },
    {
      label: 'Paid ticket volume',
      value: `ETB ${paidVolume.toLocaleString('en-US')}`,
      accent: true,
    },
  ]

  return (
    <ConsolePageShell>
      <ConsoleHeader eyebrow="Live operations" title="Admin Console" />

      {/* Metric strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cn(kpi.accent && 'border-l-2 border-[#C2A878]')}>
            <ConsoleKpiCard label={kpi.label} value={kpi.value} accent={kpi.accent} />
          </div>
        ))}
      </section>

      {/* Pending verification */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#4d5f7d]/25 pb-3">
          <h2 className="font-serif text-xl font-bold">Pending Verification</h2>
          {pendingRows.length > 0 && (
            <span className="rounded-full bg-[#FBBC05]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FBBC05]">
              {pendingRows.length} require action
            </span>
          )}
        </div>

        {pendingRows.length > 0 ? (
          <div className="space-y-2">
            {pendingRows.map((row) => (
              <div key={row.id} className={cn(CONSOLE_CARD, 'flex flex-wrap items-center justify-between gap-3 p-4')}>
                <div className="flex min-w-0 items-center gap-4">
                  {initialsTile(row.name)}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.name}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7587A7]">
                      Food business · Submitted {relativeTime(row.created_at)}
                    </p>
                  </div>
                </div>
                <BusinessVerificationActions businessId={row.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="font-semibold">Queue is clear</p>
            <p className="mt-1 text-sm text-[#7587A7]">No businesses are waiting for verification right now.</p>
          </div>
        )}
      </section>

      {/* Directory */}
      <section className="space-y-3">
        <SectionTitle>Directory</SectionTitle>
        <form method="get" className={cn(CONSOLE_CARD, 'flex items-center gap-3 px-4 py-3')}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[#7587A7]">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search entities..."
            className="w-full bg-transparent text-sm text-[#F5EFE8] outline-none placeholder:text-[#7587A7]"
          />
        </form>

        <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
                <th scope="col" className="px-4 py-3 font-semibold">Entity</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {directory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#7587A7]">
                    No entities match “{q}”.
                  </td>
                </tr>
              ) : (
                directory.map((row) => (
                  <tr key={`${row.role}-${row.id}`} className="border-b border-[#4d5f7d]/10 last:border-0">
                    <td className="px-4 py-3.5">
                      <span className="block truncate font-semibold">{row.name}</span>
                      <span className="text-[11px] tabular-nums text-[#7587A7]">ID: {row.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[#B5C7EA]">{row.role}</td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={row.status} tone={statusTone(row.status)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Link href="/dashboard/admin/businesses" className="block text-right text-xs font-semibold uppercase tracking-widest text-[#B5C7EA] transition-colors hover:text-[#DFC391]">
          View all businesses →
        </Link>
      </section>

      {/* System audit log */}
      <section className="space-y-3">
        <SectionTitle>System Audit Log</SectionTitle>
        <div className={cn(CONSOLE_CARD, 'overflow-x-auto p-4 font-mono text-xs leading-relaxed')}>
          {((auditRes.data ?? []) as Array<{ id: string; action: string; entity_type: string | null; created_at: string }>).length === 0 ? (
            <p className="font-sans text-sm text-[#7587A7]">No admin activity recorded yet.</p>
          ) : (
            (auditRes.data ?? []).map((row) => (
              <p key={row.id} className="whitespace-nowrap tabular-nums">
                <span className={auditPrefix(row.action) === '[WARN]' ? 'text-[#ff8a80]' : auditPrefix(row.action) === '[OK]' ? 'text-[#7bd88f]' : 'text-[#B5C7EA]'}>
                  {auditPrefix(row.action)}
                </span>{' '}
                <span className="text-[#F5EFE8]">{row.action}</span>
                {row.entity_type ? <span className="text-[#7587A7]"> · {row.entity_type}</span> : null}
                <span className="text-[#7587A7]"> · {relativeTime(row.created_at)}</span>
              </p>
            ))
          )}
        </div>
      </section>
    </ConsolePageShell>
  )
}
