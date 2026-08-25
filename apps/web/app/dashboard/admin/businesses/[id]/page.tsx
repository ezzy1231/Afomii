import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ConsolePageShell,
  ConsoleHeader,
  SectionTitle,
  StatusPill,
  ConsoleKpiCard,
} from '@/components/dashboard/console'
import { CONSOLE_CARD, statusTone } from '@/components/dashboard/console-shared'
import { BusinessLifecycleActions, BusinessSuspendAction } from '@/components/dashboard/admin-actions'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Business detail · Admin' }

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select(
      `id, name, email, phone, city, country, address, category, plan, status,
       is_verified, website, description, created_at, owner_id`
    )
    .eq('id', params.id)
    .maybeSingle()

  if (!business) notFound()

  const b = business as unknown as {
    id: string
    name: string
    email: string | null
    phone: string | null
    city: string | null
    country: string | null
    address: string | null
    category: string | null
    plan: string | null
    status: string
    is_verified: boolean | null
    website: string | null
    description: string | null
    created_at: string | null
    owner_id: string | null
  }

  const { data: branchRows } = await supabase
    .from('branches')
    .select('id, branch_name, address')
    .eq('business_id', b.id)
  const branches = (branchRows ?? []) as Array<{ id: string; branch_name: string; address: string | null }>
  const branchIds = branches.map((x) => x.id)

  const [restaurantsRes, menuCountRes] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, name, cuisine, area_label, rating, is_active')
      .eq('business_id', b.id),
    branchIds.length
      ? supabase.from('menu_items').select('id', { count: 'exact', head: true }).in('branch_id', branchIds)
      : Promise.resolve({ count: 0 }),
  ])

  const restaurants = (restaurantsRes.data ?? []) as Array<{
    id: string
    name: string
    cuisine: string | null
    area_label: string | null
    rating: number | null
    is_active: boolean | null
  }>

  const kpis = [
    { label: 'Listings', value: String(restaurants.length), accent: true },
    { label: 'Branches', value: String(branches.length), accent: false },
    { label: 'Menu items', value: String(menuCountRes.count ?? 0), accent: false },
  ]

  return (
    <ConsolePageShell>
      <Link
        href="/dashboard/admin/businesses"
        className="text-xs font-semibold uppercase tracking-widest text-[#7587A7] transition-colors hover:text-[#DFC391]"
      >
        ← Back to businesses
      </Link>

      <ConsoleHeader
        eyebrow="Partner console · admin view"
        title={b.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <BusinessLifecycleActions businessId={b.id} status={b.status} />
            <BusinessSuspendAction businessId={b.id} status={b.status} />
          </div>
        }
      />

      <section
        className={cn(
          'flex flex-wrap items-center gap-3 rounded-lg border p-4 text-sm',
          b.status === 'pending'
            ? 'border-[#FBBC05]/40 bg-[#FBBC05]/10'
            : 'border-[#4d5f7d]/20 bg-[#0B1D31]'
        )}
      >
        <StatusPill status={b.status} tone={statusTone(b.status)} />
        {b.is_verified && (
          <span className="rounded-full bg-[#34A853]/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7bd88f]">
            Verified
          </span>
        )}
        <span className="capitalize text-[#B5C7EA]">Plan: {b.plan ?? 'free'}</span>
        {b.category && <span className="capitalize text-[#B5C7EA]">{b.category}</span>}
      </section>

      {/* Contact + meta */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className={cn(CONSOLE_CARD, 'space-y-2 p-5 text-sm')}>
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
            Contact
          </h2>
          <p>{b.email ?? 'No email on file'}</p>
          {b.phone && <p className="tabular-nums text-[#B5C7EA]">{b.phone}</p>}
          {(b.address || b.city || b.country) && (
            <p className="truncate text-[#B5C7EA]">
              {[b.address, b.city, b.country].filter(Boolean).join(', ')}
            </p>
          )}
          {b.website && (
            <a
              href={b.website}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-[#B5C7EA] underline underline-offset-2 hover:text-[#DFC391]"
            >
              {b.website}
            </a>
          )}
        </div>
        <div className={cn(CONSOLE_CARD, 'space-y-2 p-5 text-sm')}>
          <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
            About
          </h2>
          <p className="leading-relaxed text-[#B5C7EA]">
            {b.description ?? 'No editorial description provided yet.'}
          </p>
          {b.created_at && (
            <p className="pt-1 text-xs tabular-nums text-[#7587A7]">
              Partner since{' '}
              {new Date(b.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <ConsoleKpiCard key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} />
        ))}
      </section>

      {/* Listings */}
      <section className="space-y-3">
        <SectionTitle>Listings</SectionTitle>
        {restaurants.length === 0 ? (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-[#7587A7]">This partner has no published listings yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {restaurants.map((r) => (
              <div key={r.id} className={cn(CONSOLE_CARD, 'flex items-center justify-between p-4')}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-xs capitalize text-[#7587A7]">
                    {[r.cuisine, r.area_label].filter(Boolean).join(' · ') || 'Restaurant'}
                    {r.rating != null ? ` · ★ ${String(r.rating)}` : ''}
                  </p>
                </div>
                <StatusPill
                  status={(r.is_active ?? false) ? 'active' : 'inactive'}
                  tone={(r.is_active ?? false) ? 'ok' : 'info'}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Branches */}
      <section className="space-y-3">
        <SectionTitle>Branches</SectionTitle>
        {branches.length === 0 ? (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="text-sm text-[#7587A7]">No branches created yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((br) => (
              <div key={br.id} className={cn(CONSOLE_CARD, 'flex items-center justify-between p-4')}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{br.branch_name}</p>
                  <p className="truncate text-xs text-[#7587A7]">{br.address ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ConsolePageShell>
  )
}