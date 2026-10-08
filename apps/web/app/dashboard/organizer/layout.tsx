import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/lib/supabase/queries'
import { getOrganizerAccount } from '@/lib/dashboard/organizer-data'
import { ConsoleShell } from '@/components/dashboard/console-shell'

const ROOT = '/dashboard/organizer'

const navItems = [
  { label: 'Dashboard', href: ROOT },
  { label: 'Calendar', href: `${ROOT}/calendar` },
  { label: 'Events', href: `${ROOT}/events` },
  { label: 'Tickets', href: `${ROOT}/tickets` },
  { label: 'Analytics', href: `${ROOT}/analytics` },
  { label: 'Settings', href: `${ROOT}/settings` },
]

export default async function OrganizerDashboardLayout({
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

  if ((profile?.role as string | undefined) !== 'event_organizer') redirect('/auth/no-access')

  // The rail shows the organizer's own registered name — never a hardcoded
  // placeholder, which is what made the console read as someone else's app.
  // `heal: false`: the page below owns self-healing, and two concurrent
  // heals would race two inserts for the same owner.
  const organizer = await getOrganizerAccount(supabase, user, { heal: false })
  const notificationCount = profile?.id ? await getUnreadNotificationCount(profile.id) : 0

  return (
    <ConsoleShell
      navItems={navItems}
      account={{
        organization: organizer?.name ?? profile?.full_name ?? 'Organizer',
        role: 'Event Organizer',
        displayName: profile?.full_name ?? null,
      }}
      notificationCount={notificationCount}
      primaryAction={{ label: '+ Create Event', href: `${ROOT}/events/new` }}
      homeHref={ROOT}
      settingsHref={`${ROOT}/settings`}
    >
      {children}
    </ConsoleShell>
  )
}