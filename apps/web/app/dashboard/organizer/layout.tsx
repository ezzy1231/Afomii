import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Dashboard', href: '/dashboard/organizer', icon: '📊' },
  { label: 'Events', href: '/dashboard/organizer/events', icon: '🎉' },
  { label: 'Calendar', href: '/dashboard/organizer/calendar', icon: '📅' },
  { label: 'Tickets', href: '/dashboard/organizer/tickets', icon: '🎫' },
  { label: 'Analytics', href: '/dashboard/organizer/analytics', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export default async function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const notificationCount = user ? await getUnreadNotificationCount(user.id) : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar title="Organizer" navItems={navItems} notificationCount={notificationCount} />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}