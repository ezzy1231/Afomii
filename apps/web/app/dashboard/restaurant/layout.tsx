import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Overview', href: '/dashboard/restaurant', icon: '📊' },
  { label: 'Reservations', href: '/dashboard/restaurant/reservations', icon: '📅' },
  { label: 'Menu', href: '/dashboard/restaurant/menu', icon: '🍽️' },
  { label: 'Analytics', href: '/dashboard/restaurant/analytics', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar title="Restaurant" navItems={navItems} />
      <main className="flex-1 bg-[var(--bg-primary)] overflow-auto">
        {children}
      </main>
    </div>
  )
}
