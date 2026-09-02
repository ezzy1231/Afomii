import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Overview', href: '/dashboard/admin', icon: '📊' },
  { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Businesses', href: '/dashboard/admin/businesses', icon: '🏪' },
  { label: 'Organizers', href: '/dashboard/admin/organizers', icon: '📣' },
  { label: 'Events', href: '/dashboard/admin/events', icon: '🎉' },
  { label: 'Reservations', href: '/dashboard/admin/reservations', icon: '📅' },
  { label: 'Audit Log', href: '/dashboard/admin/audit', icon: '📜' },
  { label: 'Metrics', href: '/dashboard/admin/metrics', icon: '📈' },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: '⚙️' },
]

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Admin console guard — RLS limits data, this gate limits the surface.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile?.role as string | undefined) !== 'system_admin') redirect('/auth/no-access')

  const notificationCount = await getUnreadNotificationCount(user.id)

  return (
    <div className="flex min-h-screen">
      <Sidebar title="Admin Panel" navItems={navItems} notificationCount={notificationCount} />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
