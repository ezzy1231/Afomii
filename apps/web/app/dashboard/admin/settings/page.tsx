import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ConsolePageShell, ConsoleHeader, StatusPill } from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'
import SignOutButton from '@/app/settings/SignOutButton'

export const metadata: Metadata = { title: 'Admin settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  let email: string | null = user?.email ?? null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .maybeSingle()
    role = (profile?.role as string | undefined) ?? null
    email = (profile?.email as string | undefined) ?? email
  }

  return (
    <ConsolePageShell maxWidth="max-w-2xl">
      <ConsoleHeader eyebrow="Admin console" title="Settings" subtitle="Your admin session." />

      <section className={cn(CONSOLE_CARD, 'space-y-4 p-5 text-sm')}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#7587A7]">Signed in as</span>
          <span className="font-semibold">{email ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#7587A7]">Role</span>
          {role ? <StatusPill status={role} tone={role === 'system_admin' ? 'gold' : 'info'} /> : <span>—</span>}
        </div>
        <div className="border-t border-[#4d5f7d]/20 pt-4">
          <SignOutButton />
        </div>
      </section>

      <p className="px-1 text-xs text-[#7587A7]">
        Platform configuration (roles, moderation policy, feature flags) lives in the Supabase
        dashboard and migrations for now — this panel focuses on operational control.
      </p>
    </ConsolePageShell>
  )
}