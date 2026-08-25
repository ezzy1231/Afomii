import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  { label: 'Settings', href: '/settings', icon: '⚙️' },
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

  if ((profile?.role as string | undefined) !== 'system_admin') redirect('/')

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar title="Admin Panel" navItems={navItems} />
      <main className="min-w-0 flex-1 overflow-auto bg-app-bg">
        {children}
      </main>
    </div>
  )
}
