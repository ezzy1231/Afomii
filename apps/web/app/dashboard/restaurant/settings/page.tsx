import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessAccount } from '@/lib/dashboard/restaurant-data'
import { ConsoleStack } from '@/components/dashboard/console-primitives'
import { CONSOLE_CARD } from '@/components/dashboard/console-tokens'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Restaurant Settings' }

/**
 * Partner-scoped settings for the restaurant console. See the organizer
 * twin for why this is not the consumer `/settings` page.
 */
export default async function RestaurantSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin?next=/dashboard/restaurant/settings')

  const [business, { data: profile }] = await Promise.all([
    getBusinessAccount(supabase, user),
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, city')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  if (!business) {
    return (
      <ConsoleStack eyebrow="Restaurant" title="Settings">
        <div className={`${CONSOLE_CARD} border-dashed p-10 text-center`}>
          <p className="font-semibold text-console-ink">No business profile yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-console-muted">
            Your account is not connected to a restaurant, so there is nothing to configure yet.
          </p>
        </div>
      </ConsoleStack>
    )
  }

  const fields: Array<{ label: string; value: string | null }> = [
    { label: 'Business name', value: business.name },
    { label: 'Category', value: business.category },
    { label: 'Contact email', value: business.email ?? profile?.email ?? null },
    { label: 'Phone', value: business.phone ?? profile?.phone ?? null },
    { label: 'City', value: business.city ?? profile?.city ?? null },
    { label: 'Address', value: business.address },
    { label: 'Your name', value: profile?.full_name ?? null },
  ]

  return (
    <ConsoleStack
      eyebrow="Restaurant"
      title="Settings"
      subtitle="How your venue appears across UrbanExplore."
    >
      <section className={CONSOLE_CARD}>
        <div className="border-b border-console-border px-5 py-4">
          <h2 className="text-[15px] font-bold text-console-ink">Business profile</h2>
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
                {business.plan ?? 'free'}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                business.is_verified
                  ? 'bg-console-mint text-console-mint-ink'
                  : 'bg-console-sand text-console-sand-ink',
              )}
            >
              {business.is_verified ? 'Verified' : (business.status ?? 'Pending')}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-console-muted">
            Featured placement and priority email drops are handled by the UrbanExplore team —
            there is no self-serve checkout for venue plans yet. Email us and we will place it.
          </p>

          <Link
            href="/restaurants"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-console-border px-4 text-sm font-semibold text-console-ink transition-colors hover:bg-console-bg"
          >
            Browse venues on Explore
          </Link>
        </div>
      </section>

      <section id="notifications" className={CONSOLE_CARD}>
        <div className="border-b border-console-border px-5 py-4">
          <h2 className="text-[15px] font-bold text-console-ink">Notifications</h2>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm leading-relaxed text-console-muted">
            New bookings and status changes arrive in your account email and in the bell above.
            Per-channel preferences are not editable here yet.
          </p>
        </div>
      </section>
    </ConsoleStack>
  )
}