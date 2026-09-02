import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  StatusPill,
} from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Listings · Restaurant' }

export default async function RestaurantListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user?.id ?? '')
    .maybeSingle()

  const { data: restaurants } = business
    ? await supabase
        .from('restaurants')
        .select('id, name, cuisine, area_label, city, rating, closing_label, is_active')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const rows = (restaurants ?? []) as Array<{
    id: string
    name: string
    cuisine: string | null
    area_label: string | null
    city: string | null
    rating: number | null
    closing_label: string | null
    is_active: boolean | null
  }>

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Partner console"
        title="Listings"
        subtitle="What diners see on the explore feed."
        action={
          <Link
            href="/dashboard/restaurant/listings/new"
            className="min-h-[44px] rounded-full border border-dashed border-app-border px-5 py-2.5 text-sm font-semibold text-ember transition-colors hover:border-ember/40 hover:bg-ember/10"
          >
            ＋ New listing
          </Link>
        }
      />

      {rows.length === 0 ? (
        <div className={cn(CONSOLE_CARD, 'border-dashed p-10 text-center')}>
          <p className="font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-app-muted">
            Create your first listing so diners can find and book you.
          </p>
          <Link
            href="/dashboard/restaurant/listings/new"
            className="mt-4 inline-block min-h-[44px] rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white shadow-glass transition-all hover:brightness-110"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className={cn(CONSOLE_CARD, 'flex flex-wrap items-center justify-between gap-3 p-4')}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="text-xs capitalize text-app-muted">
                  {[row.cuisine, row.area_label, row.city].filter(Boolean).join(' · ') || 'Restaurant'}
                  {row.closing_label ? ` · ${row.closing_label}` : ''}
                  {row.rating != null ? ` · ★ ${String(row.rating)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusPill status={(row.is_active ?? false) ? 'active' : 'inactive'} tone={(row.is_active ?? false) ? 'ok' : 'info'} />
                <Link
                  href={`/restaurants/${row.id}`}
                  target="_blank"
                  className="min-h-[36px] rounded-full border border-app-border px-3.5 py-1.5 text-xs font-semibold text-app-muted transition-colors hover:border-ember/30"
                >
                  View public page ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </ConsolePageShell>
  )
}
