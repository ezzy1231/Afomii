import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { ConsoleShell } from '@/components/dashboard/console-shell'

const navItems = [
  { label: 'Overview', href: '/dashboard/restaurant' },
  { label: 'Reservations', href: '/dashboard/restaurant/reservations' },
  { label: 'Listings', href: '/dashboard/restaurant/listings' },
  { label: 'Branches', href: '/dashboard/restaurant/branches' },
  { label: 'Menu', href: '/dashboard/restaurant/menu' },
  { label: 'Analytics', href: '/dashboard/restaurant/analytics' },
  { label: 'Settings', href: '/settings' },
]

const ORGANIZATION_NAME = 'Sky Garden'

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/restaurant')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile?.role as string | undefined) !== 'food_business') redirect('/auth/no-access')

  const notificationCount = profile?.id ? await getUnreadNotificationCount(profile.id) : 0

  return (
    <ConsoleShell
      navItems={navItems}
      account={{
        organization: ORGANIZATION_NAME,
        role: 'Restaurant Partner',
        displayName: profile?.full_name ?? null,
      }}
      notificationCount={notificationCount}
      primaryAction={{ label: '+ New Reservation', href: '/dashboard/restaurant/reservations' }}
    >
      {children}
    </ConsoleShell>
  )
}