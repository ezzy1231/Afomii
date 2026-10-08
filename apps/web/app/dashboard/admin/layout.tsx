import { redirect } from 'next/navigation'
import { ConsoleShell } from '@/components/dashboard/console-shell'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'

const navItems = [
  { label: 'Overview', href: '/dashboard/admin' },
  { label: 'Users', href: '/dashboard/admin/users' },
  { label: 'Businesses', href: '/dashboard/admin/businesses' },
  { label: 'Organizers', href: '/dashboard/admin/organizers' },
  { label: 'Events', href: '/dashboard/admin/events' },
  { label: 'Reservations', href: '/dashboard/admin/reservations' },
  { label: 'Audit Log', href: '/dashboard/admin/audit' },
  { label: 'Metrics', href: '/dashboard/admin/metrics' },
  { label: 'Settings', href: '/dashboard/admin/settings' },
]

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Keep the layout gate in addition to middleware and per-action authorization.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile?.role as string | undefined) !== 'system_admin') redirect('/auth/no-access')

  const notificationCount = profile?.id ? await getUnreadNotificationCount(profile.id) : 0

  return (
    <ConsoleShell
      navItems={navItems}
      account={{ organization: 'UrbanExplore', role: 'System Admin', displayName: profile?.full_name }}
      notificationCount={notificationCount}
      showPromo={false}
      homeHref="/dashboard/admin"
      settingsHref="/dashboard/admin/settings"
    >
      {children}
    </ConsoleShell>
  )
}
