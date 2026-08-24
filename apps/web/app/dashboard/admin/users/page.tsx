import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ConsolePageShell, ConsoleHeader, CONSOLE_CARD, StatusPill } from '@/components/dashboard/console'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Users · Admin' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    role: string
    created_at: string
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader eyebrow="Admin console" title="Users" subtitle="Latest registered accounts." />
      <div className={cn(CONSOLE_CARD, 'overflow-x-auto')}>
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#4d5f7d]/25 text-[11px] uppercase tracking-[0.14em] text-[#7587A7]">
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Email</th>
              <th scope="col" className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-[#7587A7]">
                  No user profiles are readable yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[#4d5f7d]/10 last:border-0">
                  <td className="px-4 py-3.5 font-semibold">{row.full_name ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[#B5C7EA]">{row.email ?? '—'}</td>
                  <td className="px-4 py-3.5"><StatusPill status={row.role} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ConsolePageShell>
  )
}
