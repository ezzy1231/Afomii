import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  CONSOLE_CARD,
} from '@/components/dashboard/console'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Audit log · Admin' }

const ENTITY_FILTERS = ['all', 'profile', 'business', 'organizer', 'event', 'reservation'] as const
const PAGE_SIZE = 50

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60_000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function prefixTone(action: string): '[OK]' | '[WARN]' | '[INFO]' {
  if (/rejected|suspend|cancel|failed/.test(action)) return '[WARN]'
  if (/approved|verified|confirm|reinstate|published/.test(action)) return '[OK]'
  return '[INFO]'
}

type AuditRow = {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: { entity?: string; q?: string; page?: string }
}) {
  const q = (searchParams?.q ?? '').trim()
  const entityFilter =
    searchParams?.entity &&
    ENTITY_FILTERS.includes(searchParams.entity as (typeof ENTITY_FILTERS)[number])
      ? searchParams.entity
      : 'all'
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? '1', 10) || 1)

  const supabase = await createClient()
  let query = supabase
    .from('audit_logs')
    .select('id, actor_id, action, entity_type, entity_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter)
  if (q) query = query.ilike('action', `%${q}%`)

  const { data } = await query
  const rows = ((data ?? []) as unknown as AuditRow[])

  // Actor emails for the visible window (profiles readable by admins).
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v))))
  const actorsRes = actorIds.length
    ? await supabase.from('profiles').select('id, email').in('id', actorIds)
    : { data: [] }
  const actors = new Map(
    ((actorsRes.data ?? []) as Array<{ id: string; email: string | null }>).map((a) => [a.id, a.email]),
  )

  const qs = (over: Record<string, string | number>) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (entityFilter !== 'all') sp.set('entity', entityFilter)
    for (const [k, v] of Object.entries(over)) sp.set(k, String(v))
    return `/dashboard/admin/audit?${sp.toString()}`
  }

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="System Audit Log"
        subtitle="Every admin and partner mutation recorded by server actions."
      />

      <div className="flex flex-col gap-3">
        <form method="get" className={cn(CONSOLE_CARD, 'flex items-center gap-3 px-4 py-3')}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-[#7587A7]">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Filter by action… e.g. verification"
            className="w-full bg-transparent text-sm text-[#F5EFE8] outline-none placeholder:text-[#7587A7]"
          />
          {entityFilter !== 'all' && <input type="hidden" name="entity" value={entityFilter} />}
        </form>
        <div className="flex flex-wrap gap-2">
          {ENTITY_FILTERS.map((e) => (
            <a
              key={e}
              href={`/dashboard/admin/audit?entity=${e}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={cn(
                'min-h-[36px] whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                entityFilter === e
                  ? 'border-[#C2A878] bg-[#C2A878]/15 text-[#DFC391]'
                  : 'border-[#4d5f7d]/40 text-[#7587A7] hover:border-[#7587A7] hover:text-[#F5EFE8]'
              )}
            >
              {e}
            </a>
          ))}
        </div>
      </div>

      <section className={cn(CONSOLE_CARD, 'overflow-x-auto p-4 font-mono text-xs leading-relaxed')}>
        {rows.length === 0 ? (
          <p className="font-sans text-sm text-[#7587A7]">No audit entries match this filter.</p>
        ) : (
          rows.map((row) => {
            const tone = prefixTone(row.action)
            const meta = row.metadata ?? {}
            const metaText = Object.entries(meta)
              .map(([k, v]) => `${k}=${String(v)}`)
              .join(' ')
            return (
              <p key={row.id} className="whitespace-nowrap tabular-nums">
                <span className={tone === '[WARN]' ? 'text-[#ff8a80]' : tone === '[OK]' ? 'text-[#7bd88f]' : 'text-[#B5C7EA]'}>
                  {tone}
                </span>{' '}
                <span className="text-[#F5EFE8]">{row.action}</span>
                {metaText && <span className="text-[#7587A7]"> · {metaText}</span>}
                <span className="text-[#7587A7]">
                  {' '}
                  · {row.entity_type ?? '—'}
                  {row.entity_id ? `#${row.entity_id.slice(0, 8)}` : ''}
                </span>
                <span className="text-[#7587A7]">
                  {' '}
                  · by {actors.get(row.actor_id ?? '') ?? 'system'} · {relativeTime(row.created_at)}
                </span>
              </p>
            )
          })
        )}
      </section>

      {/* Pagination */}
      <nav aria-label="Audit log pages" className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
        {page > 1 ? (
          <a href={qs({ page: page - 1 })} className="text-[#B5C7EA] transition-colors hover:text-[#DFC391]">
            ← Newer
          </a>
        ) : <span />}
        <span className="tabular-nums text-[#7587A7]">Page {page}</span>
        {rows.length === PAGE_SIZE ? (
          <a href={qs({ page: page + 1 })} className="text-[#B5C7EA] transition-colors hover:text-[#DFC391]">
            Older →
          </a>
        ) : <span />}
      </nav>
    </ConsolePageShell>
  )
}
