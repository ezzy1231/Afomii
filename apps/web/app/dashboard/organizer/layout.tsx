import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Dashboard', href: '/dashboard/organizer', icon: '📊' },
  { label: 'Events', href: '/dashboard/organizer/events', icon: '🎉' },
  { label: 'Calendar', href: '/dashboard/organizer/calendar', icon: '📅' },
  { label: 'Tickets', href: '/dashboard/organizer/tickets', icon: '🎫' },
  { label: 'Analytics', href: '/dashboard/organizer/analytics', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar title="Organizer" navItems={navItems} />
      <main className="min-w-0 flex-1 overflow-auto bg-app-bg">
        {children}
      </main>
    </div>
  )
}
