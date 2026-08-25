import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Overview', href: '/dashboard/restaurant', icon: '📊' },
  { label: 'Listings', href: '/dashboard/restaurant/listings', icon: '📋' },
  { label: 'Reservations', href: '/dashboard/restaurant/reservations', icon: '📅' },
  { label: 'Branches', href: '/dashboard/restaurant/branches', icon: '🏬' },
  { label: 'Menu', href: '/dashboard/restaurant/menu', icon: '🍽️' },
  { label: 'Analytics', href: '/dashboard/restaurant/analytics', icon: '📈' },
]

export default function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar title="Restaurant" navItems={navItems} />
      <main className="min-w-0 flex-1 overflow-auto bg-app-bg">
        {children}
      </main>
    </div>
  )
}
