'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { addBranch, updateBranchBookingConfig, updateRestaurantHours } from '@/app/dashboard/actions'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

type Branch = {
  id: string
  branch_name: string
  address: string | null
  phone: string | null
  booking_configs: {
    booking_mode: string
    total_tables: number
    max_guest_per_table: number
    slot_duration_minutes: number
    advance_notice_hours: number
  } | null
}

type Restaurant = {
  id: string
  name: string
  opening_hours: Record<string, { open: string; close: string }[]> | null
}

export function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (!business) { setLoading(false); return }

      const { data: branchRows } = await supabase
        .from('branches')
        .select('id, branch_name, address, phone, booking_configs(booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours)')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true })

      const { data: restaurantRows } = await supabase
        .from('restaurants')
        .select('id, name, opening_hours')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true })

      setBranches(
        (branchRows ?? []).map((b: any) => ({
          id: b.id,
          branch_name: b.branch_name,
          address: b.address,
          phone: b.phone,
          booking_configs: Array.isArray(b.booking_configs)
            ? b.booking_configs[0] ?? null
            : b.booking_configs ?? null,
        }))
      )
      setRestaurants(
        (restaurantRows ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          opening_hours: r.opening_hours ?? {},
        }))
      )
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-[var(--bg-input)]" />
  }

  return (
    <div className="space-y-6">
      <AddBranchForm />

      <section>
        <h2 className="mb-3 font-serif text-xl font-bold text-app-fg">Branches & availability</h2>
        {branches.length ? (
          <div className="space-y-4">
            {branches.map((branch) => (
              <BranchConfigCard key={branch.id} branch={branch} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-app-muted">No branches yet. Add your first branch above.</p>
        )}
      </section>

      {restaurants.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl font-bold text-app-fg">Opening hours</h2>
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <RestaurantHoursCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AddBranchForm() {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null)

  return (
    <form
      action={async (formData: FormData) => {
        const res = await addBranch(state as any, formData)
        setState(res)
      }}
      className="card-elevated p-6"
    >
      <h2 className="mb-4 font-serif text-xl font-bold text-app-fg">Add a branch</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="branchName" required placeholder="Branch name" className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-app-fg outline-none" />
        <input name="address" required placeholder="Address" className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-app-fg outline-none" />
        <input name="phone" placeholder="Phone (optional)" className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-app-fg outline-none" />
        <div className="flex gap-2">
          <input name="latitude" placeholder="Lat (optional)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-app-fg outline-none" />
          <input name="longitude" placeholder="Lng (optional)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-app-fg outline-none" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit">Add branch</Button>
        {state && (
          <p className={state.ok ? 'text-sm text-emerald-600' : 'text-sm text-red-500'}>{state.message}</p>
        )}
      </div>
    </form>
  )
}

function BranchConfigCard({ branch }: { branch: Branch }) {
  const cfg = branch.booking_configs
  const [bookingMode, setBookingMode] = useState(cfg?.booking_mode ?? 'instant')
  const [totalTables, setTotalTables] = useState(cfg?.total_tables ?? 10)
  const [maxGuestPerTable, setMaxGuestPerTable] = useState(cfg?.max_guest_per_table ?? 8)
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(cfg?.slot_duration_minutes ?? 30)
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState(cfg?.advance_notice_hours ?? 2)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setMsg(null)
    const res = await updateBranchBookingConfig({
      branchId: branch.id,
      bookingMode,
      totalTables: Number(totalTables),
      maxGuestPerTable: Number(maxGuestPerTable),
      slotDurationMinutes: Number(slotDurationMinutes),
      advanceNoticeHours: Number(advanceNoticeHours),
    })
    setSaving(false)
    setMsg(res.message)
  }

  return (
    <div className="card-elevated p-5">
      <div className="mb-4">
        <p className="font-semibold text-app-fg">{branch.branch_name}</p>
        <p className="text-sm text-app-muted">{branch.address ?? ''}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm text-app-muted">
          Booking mode
          <select
            value={bookingMode}
            onChange={(e) => setBookingMode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-app-fg outline-none"
          >
            <option value="instant">Instant</option>
            <option value="request">Request</option>
            <option value="closed">Off</option>
          </select>
        </label>
        <label className="text-sm text-app-muted">
          Tables per slot
          <input type="number" min={1} value={totalTables} onChange={(e) => setTotalTables(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-app-fg outline-none" />
        </label>
        <label className="text-sm text-app-muted">
          Max guests / table
          <input type="number" min={1} value={maxGuestPerTable} onChange={(e) => setMaxGuestPerTable(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-app-fg outline-none" />
        </label>
        <label className="text-sm text-app-muted">
          Slot duration (min)
          <input type="number" min={5} step={5} value={slotDurationMinutes} onChange={(e) => setSlotDurationMinutes(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-app-fg outline-none" />
        </label>
        <label className="text-sm text-app-muted">
          Advance notice (hrs)
          <input type="number" min={0} value={advanceNoticeHours} onChange={(e) => setAdvanceNoticeHours(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-app-fg outline-none" />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save availability'}
        </Button>
        {msg && <p className="text-sm text-app-muted">{msg}</p>}
      </div>
    </div>
  )
}

function RestaurantHoursCard({ restaurant }: { restaurant: Restaurant }) {
  const [hours, setHours] = useState<Record<string, { open: string; close: string }[]>>(
    () => structuredClone(restaurant.opening_hours ?? {})
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function setRange(day: string, open: string, close: string) {
    setHours((prev) => ({ ...prev, [day]: [{ open, close }] }))
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    const res = await updateRestaurantHours({
      restaurantId: restaurant.id,
      openingHours: hours,
    })
    setSaving(false)
    setMsg(res.message)
  }

  return (
    <div className="card-elevated p-5">
      <p className="mb-4 font-semibold text-app-fg">{restaurant.name}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const range = hours[day]?.[0] ?? { open: '12:00', close: '22:00' }
          return (
            <div key={day} className="flex items-center gap-2 text-sm capitalize text-app-muted">
              <span className="w-10">{day}</span>
              <input
                type="time"
                value={range.open}
                onChange={(e) => setRange(day, e.target.value, range.close)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-app-fg outline-none"
              />
              <span>–</span>
              <input
                type="time"
                value={range.close}
                onChange={(e) => setRange(day, range.open, e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1 text-app-fg outline-none"
              />
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save hours'}
        </Button>
        {msg && <p className="text-sm text-app-muted">{msg}</p>}
      </div>
    </div>
  )
}
