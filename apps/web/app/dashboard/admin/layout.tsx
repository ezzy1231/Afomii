import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
  { label: 'Users', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Businesses', href: '/dashboard/admin/businesses', icon: '🏪' },
  { label: 'Events', href: '/dashboard/admin/events', icon: '🎉' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar title="Admin Panel" navItems={navItems} />
      <main className="min-w-0 flex-1 overflow-auto bg-app-bg">
        {children}
      </main>
    </div>
  )
}
