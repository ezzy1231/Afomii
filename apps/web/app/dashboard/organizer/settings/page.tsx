import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrganizerAccount } from '@/lib/dashboard/organizer-data'
import { ConsoleStack } from '@/components/dashboard/console-primitives'
import { CONSOLE_CARD } from '@/components/dashboard/console-tokens'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Organizer Settings' }

/**
 * Partner-scoped settings for the organizer console.
 *
 * Deliberately not `/settings` — that route is the *consumer* account page
 * (public Navbar, "My reservations", "My tickets"), so linking a partner
 * rail at it dumped organizers out of their own console.
 */
export default async function OrganizerSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/organizer/settings')

  const [organizer, { data: profile }] = await Promise.all([
    getOrganizerAccount(supabase, user),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, city')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!organizer) {
    return (
      <ConsoleStack eyebrow="Organizer" title="Settings">
        <div className={`${CONSOLE_CARD} border-dashed p-10 text-center`}>
          <p className="font-semibold text-console-ink">No organizer profile yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-console-muted">
            Your account is not connected to an organizer, so there is nothing to configure yet.
          </p>
        </div>
      </ConsoleStack>
    )
  }

  const fields: Array<{ label: string; value: string | null }> = [
    { label: 'Organizer name', value: organizer.name },
    { label: 'Category', value: organizer.category },
    { label: 'Contact email', value: organizerEmail(organizer.email, profile?.email) },
    { label: 'Phone', value: profile?.phone ?? null },
    { label: 'City', value: profile?.city ?? null },
    { label: 'Your name', value: profile?.full_name ?? null },
  ]

  return (
    <ConsoleStack
      eyebrow="Organizer"
      title="Settings"
      subtitle="How your organizer appears across UrbanExplore."
    >
      <section className={CONSOLE_CARD}>
        <div className="border-b border-console-border px-5 py-4">
          <h2 className="text-[15px] font-bold text-console-ink">Organizer profile</h2>
        </div>
        <dl className="divide-y divide-console-border">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
            >
              <dt className="text-sm text-console-muted">{field.label}</dt>
              <dd className="text-sm font-semibold text-console-ink">
                {field.value || <span className="font-normal text-console-muted">Not set</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="boost" className={CONSOLE_CARD}>
        <div className="border-b border-console-border px-5 py-4">
          <h2 className="text-[15px] font-bold text-console-ink">Plan &amp; visibility</h2>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-console-muted">Current plan</p>
              <p className="mt-0.5 text-lg font-bold capitalize text-console-ink">
                {organizer.plan ?? 'free'}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                organizer.is_verified
                  ? 'bg-console-mint text-console-mint-ink'
                  : 'bg-console-sand text-console-sand-ink',
              )}
            >
              {organizer.is_verified ? 'Verified' : (organizer.status ?? 'Pending')}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-console-muted">
            Featured placement and priority email drops are handled by the UrbanExplore team —
            there is no self-serve checkout for organizer plans yet. Email us with your event dates
            and we will place it.
          </p>

          <Link
            href="/events"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-console-border px-4 text-sm font-semibold text-console-ink transition-colors hover:bg-console-bg"
          >
            Preview how your listing looks
          </Link>
        </div>
      </section>

      <section id="notifications" className={CONSOLE_CARD}>
        <div className="border-b border-console-border px-5 py-4">
          <h2 className="text-[15px] font-bold text-console-ink">Notifications</h2>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm leading-relaxed text-console-muted">
            Ticket sales and booking updates arrive in your account email and in the bell above.
            Per-channel preferences are not editable here yet.
          </p>
        </div>
      </section>
    </ConsoleStack>
  )
}

function organizerEmail(
  organizerEmailValue: string | null | undefined,
  fallback: string | null | undefined,
) {
  return organizerEmailValue ?? fallback ?? null
}