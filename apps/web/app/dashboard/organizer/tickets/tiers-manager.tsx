'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  saveTicketTier,
  deleteTicketTier,
  type TierActionState,
} from './actions'
import type { EventOption, TierRecord } from './page'

type TierRow = {
  id: string
  eventId: string
  name: string
  tier: string
  price: string
  totalQuantity: string
  remainingQuantity: number | null
  salesStart: string
  salesEnd: string
}

const TIER_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'early_bird', label: 'Early Bird' },
  { value: 'vip', label: 'VIP' },
  { value: 'group', label: 'Group' },
]

function toInputValue(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function newBlankRow(eventId: string): TierRow {
  return {
    id: `new-${crypto.randomUUID()}`,
    eventId,
    name: '',
    tier: 'standard',
    price: '',
    totalQuantity: '',
    remainingQuantity: null,
    salesStart: '',
    salesEnd: '',
  }
}

export function TiersManager({
  events,
  initialTiers,
}: {
  events: EventOption[]
  initialTiers: TierRecord[]
}) {
  const [rows, setRows] = useState<TierRow[]>(() =>
    initialTiers.map((t) => ({
      id: t.id,
      eventId: t.eventId,
      name: t.name,
      tier: t.tier,
      price: String(t.price),
      totalQuantity: String(t.totalQuantity),
      remainingQuantity: t.remainingQuantity,
      salesStart: toInputValue(t.salesStart),
      salesEnd: toInputValue(t.salesEnd),
    }))
  )
  const [state, setState] = useState<TierActionState>({ ok: true, message: '' })
  const [pending, startTransition] = useTransition()

  function update(id: string, patch: Partial<TierRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow(eventId: string) {
    if (!eventId) return
    setRows((prev) => [...prev, newBlankRow(eventId)])
  }

  function removeLocal(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function persist(row: TierRow) {
    startTransition(async () => {
      const result = await saveTicketTier({
        id: isExisting(row.id) ? row.id : undefined,
        eventId: row.eventId,
        name: row.name,
        tier: row.tier,
        price: Number(row.price),
        totalQuantity: Number(row.totalQuantity),
        salesStart: row.salesStart || null,
        salesEnd: row.salesEnd || null,
      })
      setState(result)
    })
  }

  function destroy(row: TierRow) {
    if (!isExisting(row.id)) {
      removeLocal(row.id)
      return
    }
    startTransition(async () => {
      const result = await deleteTicketTier(row.id)
      setState(result)
      if (result.ok) removeLocal(row.id)
    })
  }

  // Group rows under their event so the page reads like a box office.
  return (
    <div className="mt-8 space-y-8">
      {events.map((event) => {
        const eventRows = rows.filter((r) => r.eventId === event.id)
        const hasNew = eventRows.some((r) => !isExisting(r.id))
        return (
          <section key={event.id} className="card-elevated p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className=" text-lg font-bold text-app-fg">{event.title}</h2>
              <button
                type="button"
                onClick={() => addRow(event.id)}
                disabled={hasNew}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-gradient-to-br from-ember to-ember-deep px-4 text-sm font-semibold text-white shadow-[0_2px_8px_rgb(var(--ember-rgb)/0.3)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-40"
              >
                <Plus className="size-4" />
                Add tier
              </button>
            </div>

            {eventRows.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-app-border px-4 py-6 text-center text-sm text-app-muted">
                No tiers yet for this event. Add one to open ticket sales.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {eventRows.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border border-app-border bg-[var(--bg-primary)] p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr_1fr_auto]">
                      <label className="block text-sm font-medium text-app-fg">
                        <span className="mb-1 block text-xs text-app-muted">Tier name</span>
                        <input
                          className="input-premium"
                          placeholder="General Admission"
                          value={row.name}
                          onChange={(e) => update(row.id, { name: e.target.value })}
                        />
                      </label>
                      <label className="block text-sm font-medium text-app-fg">
                        <span className="mb-1 block text-xs text-app-muted">Type</span>
                        <select
                          className="input-premium"
                          value={row.tier}
                          onChange={(e) => update(row.id, { tier: e.target.value })}
                        >
                          {TIER_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-medium text-app-fg">
                        <span className="mb-1 block text-xs text-app-muted">Price ETB</span>
                        <input
                          type="number"
                          min={0}
                          className="input-premium tabular-nums"
                          placeholder="500"
                          value={row.price}
                          onChange={(e) => update(row.id, { price: e.target.value })}
                        />
                      </label>
                      <label className="block text-sm font-medium text-app-fg">
                        <span className="mb-1 block text-xs text-app-muted">
                          Quantity{row.remainingQuantity != null ? ` · ${row.remainingQuantity} left` : ''}
                        </span>
                        <input
                          type="number"
                          min={1}
                          className="input-premium tabular-nums"
                          placeholder="200"
                          value={row.totalQuantity}
                          onChange={(e) => update(row.id, { totalQuantity: e.target.value })}
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-app-fg">
                          <span className="mb-1 block text-xs text-app-muted">Sales start</span>
                          <input
                            type="datetime-local"
                            className="input-premium"
                            value={row.salesStart}
                            onChange={(e) => update(row.id, { salesStart: e.target.value })}
                          />
                        </label>
                        <label className="block text-sm font-medium text-app-fg">
                          <span className="mb-1 block text-xs text-app-muted">Sales end</span>
                          <input
                            type="datetime-local"
                            className="input-premium"
                            value={row.salesEnd}
                            onChange={(e) => update(row.id, { salesEnd: e.target.value })}
                          />
                        </label>
                      </div>
                      <div className="flex items-end gap-2 lg:flex-col">
                        <button
                          type="button"
                          onClick={() => persist(row)}
                          disabled={pending}
                          className="min-h-[44px] flex-1 whitespace-nowrap rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50 dark:bg-ember/15 dark:text-ember lg:w-full"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => destroy(row)}
                          disabled={pending}
                          aria-label={`Delete ${row.name || 'tier'}`}
                          className="tap-target flex min-h-[44px] items-center justify-center rounded-xl border border-app-border px-3 text-danger transition-colors hover:border-danger/40 disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}

      {state.message && (
        <p
          role="status"
          className={`animate-pop-in rounded-xl border px-4 py-3 text-sm ${
            state.ok
              ? 'border-ember/20 bg-ember/10 text-app-fg'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  )
}

// Unsaved rows carry a `new-` prefix so we never send their local id to the server.
function isExisting(id: string) {
  return !id.startsWith('new-')
}
