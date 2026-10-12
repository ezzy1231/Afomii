import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  FilterChip,
  StatusPill,
} from '@/components/dashboard/console'
import { statusTone } from '@/components/dashboard/console-shared'
import { AdminTable } from '@/components/dashboard/admin-table'
import {
  getVerificationQueue,
  type VerificationRequestStatus,
} from '@/lib/dashboard/verification-data'

export const metadata: Metadata = { title: 'Verification · Admin' }

const SCOPES = ['open', 'pending', 'in_review', 'needs_info', 'approved', 'rejected', 'all'] as const
type Scope = (typeof SCOPES)[number]

const SCOPE_LABEL: Record<Scope, string> = {
  open: 'Needs decision',
  pending: 'Queued',
  in_review: 'In review',
  needs_info: 'Needs info',
  approved: 'Approved',
  rejected: 'Declined',
  all: 'Everything',
}

function relativeAge(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day'
  return `${days} days`
}

/**
 * The verification queue.
 *
 * Until this existed, the only way a partner became visible was an admin
 * opening /dashboard/admin/businesses and pressing Verify on a row that happened
 * to be sitting on status = 'pending'. There was no queue, no submission and no
 * documents, and partners had no way to ask or to learn they were waiting.
 */
export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams?: { scope?: string }
}) {
  const scope: Scope = SCOPES.includes(searchParams?.scope as Scope)
    ? (searchParams?.scope as Scope)
    : 'open'

  const supabase = await createClient()
  const { rows, openCount } = await getVerificationQueue(
    supabase,
    scope as 'open' | 'all' | VerificationRequestStatus,
  )

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Verification"
        subtitle={
          openCount > 0
            ? `${openCount} ${openCount === 1 ? 'request needs' : 'requests need'} a decision.`
            : 'Nothing is waiting on you.'
        }
      />

      <div className="flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <FilterChip
            key={s}
            href={`/dashboard/admin/verification?scope=${s}`}
            active={scope === s}
          >
            {SCOPE_LABEL[s]}
            {s === 'open' && openCount > 0 ? ` (${openCount})` : ''}
          </FilterChip>
        ))}
      </div>

      <AdminTable
        caption="Verification requests"
        basePath="/dashboard/admin/verification"
        query={{ scope: scope === 'open' ? undefined : scope }}
        page={1}
        total={rows.length}
        emptyText={
          scope === 'open'
            ? 'No requests are waiting on a decision.'
            : 'No requests match this filter.'
        }
        columns={[
          { key: 'entity', label: 'Partner' },
          { key: 'legal_name', label: 'Legal name' },
          { key: 'registration', label: 'Registration' },
          { key: 'docs', label: 'Docs', align: 'right' },
          { key: 'status', label: 'Status' },
          { key: 'submitted_at', label: 'Waiting', align: 'right' },
        ]}
        rows={rows.map((row) => ({
          key: row.id,
          cells: [
            <Link
              key="entity"
              href={`/dashboard/admin/verification/${row.id}`}
              className="font-semibold underline-offset-2 hover:underline"
            >
              {row.entityName}
              <span className="ml-2 text-xs font-normal text-app-muted">
                {row.entityType === 'business' ? 'restaurant' : 'organizer'}
              </span>
            </Link>,
            <span key="legal">{row.legalName}</span>,
            <span key="reg" className="text-app-muted">
              {row.registrationNumber || row.city || '—'}
            </span>,
            <span key="docs" className="tabular-nums text-app-muted">
              {row.documentCount}
            </span>,
            <StatusPill key="status" status={row.status} tone={statusTone(row.status)} />,
            <span key="age" className="whitespace-nowrap tabular-nums text-app-muted">
              {row.decidedAt
                ? new Date(row.decidedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : relativeAge(row.submittedAt)}
            </span>,
          ],
        }))}
      />

      <p className="px-1 text-xs text-app-muted">
        Approving sets <code>status = active</code> and <code>is_verified = true</code> together —
        the public feed needs both, so approving only one would leave the partner invisible.
      </p>
    </ConsolePageShell>
  )
}