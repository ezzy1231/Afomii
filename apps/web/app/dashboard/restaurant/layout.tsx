import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { Sidebar } from '@/components/dashboard/sidebar'

const navItems = [
  { label: 'Overview', href: '/dashboard/restaurant', icon: '📊' },
  { label: 'Listings', href: '/dashboard/restaurant/listings', icon: '📋' },
  { label: 'Reservations', href: '/dashboard/restaurant/reservations', icon: '📅' },
  { label: 'Branches', href: '/dashboard/restaurant/branches', icon: '🏬' },
  { label: 'Menu', href: '/dashboard/restaurant/menu', icon: '🍽️' },
  { label: 'Analytics', href: '/dashboard/restaurant/analytics', icon: '📈' },
]

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const notificationCount = user ? await getUnreadNotificationCount(user.id) : 0

  return (
    <div className="flex min-h-screen">
      <Sidebar title="Restaurant" navItems={navItems} notificationCount={notificationCount} />
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}