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
    <div className="flex min-h-screen">
      <Sidebar title="Organizer" navItems={navItems} />
      <main className="flex-1 bg-[var(--bg-primary)] overflow-auto">
        {children}
      </main>
    </div>
  )
}
