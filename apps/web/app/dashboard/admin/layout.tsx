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
    <div className="flex min-h-screen">
      <Sidebar title="Admin Panel" navItems={navItems} />
      <main className="flex-1 bg-[var(--bg-primary)] overflow-auto">
        {children}
      </main>
    </div>
  )
}
