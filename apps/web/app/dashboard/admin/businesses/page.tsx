import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  CONSOLE_CARD,
  StatusPill,
  statusTone,
} from '@/components/dashboard/console'
import { BusinessVerificationActions } from '@/components/dashboard/business-verification-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Businesses · Admin' }

export default async function AdminBusinessesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('id, name, status, is_verified, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (data ?? []) as Array<{
    id: string
    name: string
    status: string
    is_verified: boolean | null
    created_at: string
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Admin console"
        title="Businesses"
        subtitle="Verify partners or review their moderation status."
      />
      <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">Business</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Verified</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No businesses registered yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[#4d5f7d]/10 last:border-0">
                  <td className="px-4 py-3.5">
                    <span className="block truncate font-semibold">{row.name}</span>
                    <span className="text-[11px] tabular-nums text-[#7587A7]">ID: {row.id.slice(0, 8).toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3.5"><StatusPill status={row.status} tone={statusTone(row.status)} /></td>
                  <td className="px-4 py-3.5 text-[#B5C7EA]">{row.is_verified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end">
                      <BusinessVerificationActions businessId={row.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ConsolePageShell>
  )
}
