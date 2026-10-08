import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { ConsoleShell } from '@/components/dashboard/console-shell'

const navItems = [
  { label: 'Dashboard', href: '/dashboard/organizer' },
  { label: 'Calendar', href: '/dashboard/organizer/calendar' },
  { label: 'Events', href: '/dashboard/organizer/events' },
  { label: 'Tickets', href: '/dashboard/organizer/tickets' },
  { label: 'Analytics', href: '/dashboard/organizer/analytics' },
  { label: 'Settings', href: '/settings' },
]

const ORGANIZATION_NAME = 'PartyWave Events'

export default async function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/organizer')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile?.role as string | undefined) !== 'event_organizer') redirect('/auth/no-access')

  const notificationCount = profile?.id ? await getUnreadNotificationCount(profile.id) : 0

  return (
    <ConsoleShell
      navItems={navItems}
      account={{
        organization: ORGANIZATION_NAME,
        role: 'Event Organizer',
        displayName: profile?.full_name ?? null,
      }}
      notificationCount={notificationCount}
      primaryAction={{ label: '+ Create Event', href: '/dashboard/organizer/events/new' }}
    >
      {children}
    </ConsoleShell>
  )
}