'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addBranch, updateBranchBookingConfig, updateRestaurantHours } from '@/app/dashboard/actions'
import {
  ConsoleHeader,
  ConsoleSkeletonRow,
  SectionTitle,
} from './console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

type BookingConfig = {
  booking_mode: string
  total_tables: number
  max_guest_per_table: number
  slot_duration_minutes: number
  advance_notice_hours: number
  cancellation_policy?: string | null
}

type Branch = {
  id: string
  branch_name: string
  address: string | null
  phone: string | null
  booking_configs: BookingConfig | null
}

type Restaurant = {
  id: string
  name: string
  opening_hours: Record<string, { open: string; close: string }[]> | null
}

const BOOKING_MODES = [
  { value: 'closed', title: 'Walk-in Only', hint: 'No reservations accepted.' },
  { value: 'instant', title: 'Time Slots', hint: 'Guests book specific times.' },
  { value: 'request', title: 'Request Mode', hint: 'Manual approval required.' },
] as const

/** Numbered − / + pill cluster from the branch_configuration artboard. */
function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  min?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-[#B5C7EA]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex size-11 items-center justify-center rounded-full border border-[#4d5f7d]/40 text-lg leading-none text-[#F5EFE8] transition-colors hover:border-[#C2A878] hover:text-[#DFC391] disabled:opacity-40"
        >
          −
        </button>
        <span className="w-10 text-center font-serif text-xl font-bold tabular-nums text-[#DFC391]">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="flex size-11 items-center justify-center rounded-full border border-[#4d5f7d]/40 text-lg leading-none text-[#F5EFE8] transition-colors hover:border-[#C2A878] hover:text-[#DFC391]"
        >
          ＋
        </button>
      </div>
    </div>
  )
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
        .select('id, branch_name, address, phone, booking_configs(booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours, cancellation_policy)')
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

  return (
    <ConsolePage>
      <ConsoleHeader
        eyebrow="Partner console"
        title="Booking Settings"
        subtitle="Configure availability and rules."
      />

      <section className="space-y-3">
        <SectionTitle>Add a branch</SectionTitle>
        <AddBranchForm />
      </section>

      <section className="space-y-3">
        <SectionTitle>Branches</SectionTitle>
        {loading ? (
          <ConsoleSkeletonRow count={2} />
        ) : branches.length ? (
          <div className="space-y-4">
            {branches.map((branch) => (
              <BranchConfigCard key={branch.id} branch={branch} />
            ))}
          </div>
        ) : (
          <div className={cn(CONSOLE_CARD, 'border-dashed p-8 text-center')}>
            <p className="font-semibold">No branches yet</p>
            <p className="mt-1 text-sm text-[#7587A7]">Add your first branch above to configure availability.</p>
          </div>
        )}
      </section>

      {!loading && restaurants.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Opening hours</SectionTitle>
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <RestaurantHoursCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}
    </ConsolePage>
  )
}

function ConsolePage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[#07192B] px-4 pb-16 pt-8 text-[#F5EFE8] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">{children}</div>
    </div>
  )
}

const consoleInput =
  'w-full rounded-lg border border-[#4d5f7d]/30 bg-[#07192B] px-3.5 py-2.5 text-sm text-[#F5EFE8] outline-none transition-colors placeholder:text-[#7587A7]/70 focus:border-[#C2A878]'

function AddBranchForm() {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null)

  return (
    <form
      action={async (formData: FormData) => {
        const res = await addBranch(state as any, formData)
        setState(res)
      }}
      className={cn(CONSOLE_CARD, 'border-dashed p-6')}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#7587A7]">New branch</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="branchName" required placeholder="e.g. Bole" className={consoleInput} />
        <input name="address" required placeholder="Address" className={consoleInput} />
        <input name="phone" placeholder="Phone (optional)" className={consoleInput} />
        <div className="flex gap-2">
          <input name="latitude" placeholder="Lat (optional)" className={`w-full ${consoleInput}`} />
          <input name="longitude" placeholder="Lng (optional)" className={`w-full ${consoleInput}`} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="min-h-[44px] rounded-full bg-[#C2A878] px-6 text-sm font-semibold text-navy shadow-lg shadow-black/25 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Add branch
        </button>
        {state && (
          <p className={cn('text-sm', state.ok ? 'text-[#7bd88f]' : 'text-[#ff8a80]')}>{state.message}</p>
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
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(cfg?.slot_duration_minutes ?? 60)
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState(cfg?.advance_notice_hours ?? 2)
  const [cancellationPolicy, setCancellationPolicy] = useState(cfg?.cancellation_policy ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const initial = `${cfg?.booking_mode ?? 'instant'}|${cfg?.total_tables ?? 10}|${cfg?.max_guest_per_table ?? 8}|${cfg?.slot_duration_minutes ?? 60}|${cfg?.advance_notice_hours ?? 2}|${cfg?.cancellation_policy ?? ''}`
  const current = `${bookingMode}|${totalTables}|${maxGuestPerTable}|${slotDurationMinutes}|${advanceNoticeHours}|${cancellationPolicy}`
  const dirty = initial !== current

  function discard() {
    setBookingMode(cfg?.booking_mode ?? 'instant')
    setTotalTables(cfg?.total_tables ?? 10)
    setMaxGuestPerTable(cfg?.max_guest_per_table ?? 8)
    setSlotDurationMinutes(cfg?.slot_duration_minutes ?? 60)
    setAdvanceNoticeHours(cfg?.advance_notice_hours ?? 2)
    setCancellationPolicy(cfg?.cancellation_policy ?? '')
    setMsg(null)
  }

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
      cancellationPolicy,
    })
    setSaving(false)
    setMsg(res.message)
  }

  // Live preview of what guests see, per the artboard's navy strip.
  const guestSummary =
    bookingMode === 'closed'
      ? 'Walk-in only · no online reservations'
      : [
          bookingMode === 'instant' ? 'Instant confirmation' : 'Request to book',
          `up to ${maxGuestPerTable} guests`,
          advanceNoticeHours > 0 ? `book ${advanceNoticeHours}h ahead` : 'same-day bookings',
        ].join(' · ')

  return (
    <div className={cn(CONSOLE_CARD, 'overflow-hidden')}>
      {/* Branch header */}
      <div className="border-b border-[#4d5f7d]/20 px-5 py-4">
        <p className="font-serif text-lg font-bold">{branch.branch_name}</p>
        {branch.address && <p className="mt-0.5 text-xs text-[#7587A7]">{branch.address}</p>}
      </div>

      <div className="space-y-6 p-5">
        {/* 1. Booking mode — radio cards */}
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
            1. Booking mode
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {BOOKING_MODES.map((mode) => {
              const active = bookingMode === mode.value
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setBookingMode(mode.value)}
                  className={cn(
                    'relative rounded-lg border p-4 text-left transition-all',
                    active
                      ? 'border-2 border-[#C2A878] bg-[#C2A878]/10'
                      : 'border-[#4d5f7d]/35 hover:border-[#7587A7]'
                  )}
                >
                  {active && (
                    <span aria-hidden className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C2A878] text-[11px] font-bold text-navy">
                      ✓
                    </span>
                  )}
                  <span className={cn('block text-sm font-bold', active ? 'text-[#DFC391]' : 'text-[#F5EFE8]')}>
                    {mode.title}
                  </span>
                  <span className="mt-1 block text-xs text-[#7587A7]">{mode.hint}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* 2. Capacity — steppers */}
        <fieldset>
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
            2. Capacity
          </legend>
          <div className="divide-y divide-[#4d5f7d]/20">
            <Stepper label="Total tables" value={totalTables} onChange={(v) => setTotalTables(Math.max(0, v))} />
            <Stepper label="Max guests / table" value={maxGuestPerTable} onChange={(v) => setMaxGuestPerTable(Math.max(1, v))} min={1} />
          </div>
        </fieldset>

        {/* 3. Policy */}
        <fieldset>
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7587A7]">
            3. Policy
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[#B5C7EA]">Slot duration</span>
              <select
                value={String(slotDurationMinutes)}
                onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                className={consoleInput}
              >
                {[30, 60, 90, 120].map((mins) => (
                  <option key={mins} value={String(mins)}>{mins} min</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[#B5C7EA]">Advance notice (hours)</span>
              <input
                type="number"
                min={0}
                max={720}
                value={advanceNoticeHours}
                onChange={(e) => setAdvanceNoticeHours(Number(e.target.value))}
                className={`${consoleInput} tabular-nums`}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-[#B5C7EA]">Cancellation policy</span>
              <textarea
                rows={2}
                maxLength={500}
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                placeholder="Enter terms… e.g. Free cancellation up to 2 hours before the reservation."
                className={`${consoleInput} resize-none`}
              />
            </label>
          </div>
        </fieldset>

        {/* Live preview strip */}
        <div className="flex items-start gap-2.5 rounded-lg border border-[#4d5f7d]/25 bg-[#07192B] px-4 py-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-[#DFC391]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <p className="text-xs leading-relaxed text-[#B5C7EA]">
            <span className="font-semibold uppercase tracking-widest text-[#7587A7]">Guests see:</span>{' '}
            {guestSummary}
            {cancellationPolicy.trim() ? ` · ${cancellationPolicy.trim()}` : ''}
          </p>
        </div>
      </div>

      {/* Save bar — mirrors the artboard's unsaved-changes treatment */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 transition-colors',
          dirty ? 'border-[#C2A878]/40 bg-[#C2A878]/[0.06]' : 'border-[#4d5f7d]/20'
        )}
      >
        <span className={cn('text-sm italic', dirty ? 'text-[#DFC391]' : 'text-transparent select-none')} aria-hidden={!dirty}>
          Unsaved changes
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || saving}
            className="min-h-[44px] rounded-full border border-[#4d5f7d]/40 px-5 text-sm font-semibold text-[#B5C7EA] transition-colors hover:border-[#7587A7] disabled:pointer-events-none disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="min-h-[44px] rounded-full bg-[#C2A878] px-6 text-sm font-semibold text-navy shadow-lg shadow-black/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {msg && !dirty && <p className="w-full text-xs text-[#7bd88f]">{msg}</p>}
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
    <div className={cn(CONSOLE_CARD, 'p-5')}>
      <p className="mb-4 font-serif text-lg font-bold">{restaurant.name}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => {
          const range = hours[day]?.[0] ?? { open: '12:00', close: '22:00' }
          return (
            <div key={day} className="flex items-center gap-2 text-sm capitalize">
              <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-widest text-[#7587A7]">
                {DAY_LABELS[day].slice(0, 3)}
              </span>
              <input
                type="time"
                aria-label={`${DAY_LABELS[day]} opens`}
                value={range.open}
                onChange={(e) => setRange(day, e.target.value, range.close)}
                className="rounded-md border border-[#4d5f7d]/30 bg-[#07192B] px-2 py-1.5 text-xs tabular-nums text-[#F5EFE8] outline-none focus:border-[#C2A878]"
              />
              <span className="text-[#7587A7]">–</span>
              <input
                type="time"
                aria-label={`${DAY_LABELS[day]} closes`}
                value={range.close}
                onChange={(e) => setRange(day, range.open, e.target.value)}
                className="rounded-md border border-[#4d5f7d]/30 bg-[#07192B] px-2 py-1.5 text-xs tabular-nums text-[#F5EFE8] outline-none focus:border-[#C2A878]"
              />
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-[44px] rounded-full bg-[#C2A878] px-6 text-sm font-semibold text-navy shadow-lg shadow-black/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save hours'}
        </button>
        {msg && <p className="text-sm text-[#7bd88f]">{msg}</p>}
      </div>
    </div>
  )
}