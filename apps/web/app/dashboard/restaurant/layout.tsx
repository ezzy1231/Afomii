import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { getBusinessAccount } from '@/lib/dashboard/restaurant-data'
import { ConsoleShell } from '@/components/dashboard/console-shell'

const ROOT = '/dashboard/restaurant'

const navItems = [
  { label: 'Overview', href: ROOT },
  { label: 'Reservations', href: `${ROOT}/reservations` },
  { label: 'Listings', href: `${ROOT}/listings` },
  { label: 'Analytics', href: `${ROOT}/analytics` },
  { label: 'Settings', href: `${ROOT}/settings` },
]

export default async function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/signin?next=${ROOT}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile?.role as string | undefined) !== 'food_business') redirect('/auth/no-access')

  // The rail shows the venue's own registered name. `heal: false` — see the
  // organizer layout.
  const business = await getBusinessAccount(supabase, user, { heal: false })
  const notificationCount = profile?.id ? await getUnreadNotificationCount(profile.id) : 0

  return (
    <ConsoleShell
      navItems={navItems}
      account={{
        organization: business?.name ?? profile?.full_name ?? 'Restaurant',
        role: 'Restaurant Partner',
        displayName: profile?.full_name ?? null,
      }}
      notificationCount={notificationCount}
      primaryAction={{ label: '+ New Reservation', href: `${ROOT}/reservations` }}
      homeHref={ROOT}
      settingsHref={`${ROOT}/settings`}
    >
      {children}
    </ConsoleShell>
  )
}
