'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToggleSwitch } from '@/components/dashboard/console'
import { MenuImporter } from '@/components/dashboard/menu-importer'
import { cn } from '@/lib/utils'

type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  isAvailable: boolean
}

type MenuRow = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  is_available: boolean
}

const CATEGORIES = ['Appetizers', 'Mains', 'Grills', 'Drinks', 'Desserts', 'General']

function formatETB(value: number) {
  return `ETB ${Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toItem(row: MenuRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    isAvailable: Boolean(row.is_available),
  }
}

/**
 * Menu items for one branch. Nested inside the branch card so every location
 * on a listing owns the dishes it actually serves.
 */
export function BranchMenu({
  branchId,
  branchName,
}: {
  branchId: string
  branchName: string
}) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', price: '', category: 'Mains', description: '' })
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, description, price, category, is_available')
      .eq('branch_id', branchId)
      .order('category')
      .order('name')
    if (error) {
      setLoadError('Could not load this branch’s menu. Refresh and try again.')
      setLoading(false)
      return
    }
    setLoadError(null)
    setItems(((data ?? []) as unknown as MenuRow[]).map(toItem))
    setLoading(false)
  }, [branchId])

  useEffect(() => {
    let active = true
    async function fetchItems() {
      const supabase = createClient()
      setLoading(true)
      const { data } = await supabase
        .from('menu_items')
        .select('id, name, description, price, category, is_available')
        .eq('branch_id', branchId)
        .order('category')
        .order('name')
      if (!active) return
      setItems(((data ?? []) as unknown as MenuRow[]).map(toItem))
      setLoading(false)
    }
    void fetchItems()
    return () => {
      active = false
    }
  }, [branchId])

  function openCreate() {
    openerRef.current = document.activeElement as HTMLElement | null
    setFormError(null)
    setEditing(null)
    setDraft({ name: '', price: '', category: 'Mains', description: '' })
    setCreating(true)
  }

  function openEdit(item: MenuItem) {
    openerRef.current = document.activeElement as HTMLElement | null
    setFormError(null)
    setEditing(item)
    setDraft({
      name: item.name,
      price: String(item.price),
      category: item.category,
      description: item.description ?? '',
    })
    setCreating(true)
  }

  function closeModal() {
    setCreating(false)
    setEditing(null)
    setFormError(null)
  }

  useEffect(() => {
    if (!creating) return
    const panel = dialogRef.current
    if (!panel) return

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()

    function focusables() {
      return Array.from(
        panel!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = focusables()
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      openerRef.current?.focus()
    }
  }, [creating])

  async function saveItem(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || !draft.price) return
    setSaving(true)
    setFormError(null)
    const supabase = createClient()
    const payload = {
      branch_id: branchId,
      name: draft.name.trim(),
      price: parseFloat(draft.price),
      category: draft.category || 'General',
      description: draft.description.trim() || null,
      ...(editing ? { is_available: editing.isAvailable } : null),
    }

    let error: { message: string } | null = null
    if (editing) {
      const res = await supabase.from('menu_items').update(payload).eq('id', editing.id).select().single()
      error = res.error
      if (!error && res.data) {
        const row = res.data as unknown as MenuRow
        setItems((prev) => prev.map((i) => (i.id === editing.id ? toItem(row) : i)))
      }
    } else {
      const res = await supabase.from('menu_items').insert(payload).select().single()
      error = res.error
      if (!error && res.data) {
        const row = res.data as unknown as MenuRow
        setItems((prev) => [...prev, toItem(row)])
      }
    }
    if (error) setFormError(error.message)
    else closeModal()
    setSaving(false)
  }

  async function toggleAvailability(item: MenuItem) {
    const next = !item.isAvailable
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)))
    const supabase = createClient()
    const { error } = await supabase.from('menu_items').update({ is_available: next }).eq('id', item.id)
    if (error) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !next } : i)))
  }

  async function removeItem(item: MenuItem) {
    const supabase = createClient()
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (error) {
      setLoadError('Could not remove that item. Refresh and try again.')
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <section className="space-y-3 border-t border-app-border px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
          Menu · {branchName}
        </h3>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-9 rounded-full border border-dashed border-app-border px-4 text-xs font-semibold text-ember transition-colors hover:border-ember/40 hover:bg-ember/10"
        >
          ＋ Add item
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-app-muted">Loading menu…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-app-muted">
          No dishes yet for this location. Add items by hand, or import a PDF or photo of the menu
          below.
        </p>
      ) : (
        <ul className="divide-y divide-app-border">
          {items.map((item) => (
            <li key={item.id} className={cn('flex items-center justify-between gap-3 py-2.5', !item.isAvailable && 'opacity-60')}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-app-muted">
                  {item.category} · <span className="font-bold tabular-nums text-ember">{formatETB(item.price)}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ToggleSwitch
                  checked={item.isAvailable}
                  onChange={() => toggleAvailability(item)}
                  label={`${item.isAvailable ? 'Hide' : 'Show'} ${item.name}`}
                />
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  aria-label={`Edit ${item.name}`}
                  className="min-h-9 rounded-full px-3 text-xs font-semibold text-app-muted transition-colors hover:text-app-fg"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  aria-label={`Remove ${item.name}`}
                  className="min-h-9 rounded-full px-3 text-xs font-semibold text-app-muted transition-colors hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MenuImporter
        branchId={branchId}
        branchName={branchName}
        onImported={load}
      />

      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Close"
            onClick={closeModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-menu-item-title"
            className="animate-pop-in glass relative max-h-[90vh] w-full overflow-y-auto rounded-t-xl p-6 safe-bottom sm:max-w-lg sm:rounded-3xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h4 id="branch-menu-item-title" className="text-xl font-bold">
                {editing ? 'Edit item' : 'Add item'}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="flex size-11 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-elevated hover:text-app-fg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveItem} className="space-y-4">
              <div>
                <label htmlFor="bm-name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
                  Item name
                </label>
                <input
                  id="bm-name"
                  ref={firstFieldRef}
                  required
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Doro Wat Premium"
                  className="w-full rounded-lg border border-app-border px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bm-price" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
                    Price
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ember">
                      ETB
                    </span>
                    <input
                      id="bm-price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                      placeholder="450"
                      className="w-full rounded-lg border border-app-border py-2.5 pl-12 pr-3.5 text-sm tabular-nums text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/40"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="bm-category" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
                    Category
                  </label>
                  <select
                    id="bm-category"
                    value={draft.category}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    className="w-full rounded-lg border border-app-border px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors focus:border-ember/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="bm-desc" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">
                  Description
                </label>
                <textarea
                  id="bm-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Ingredients or menu details"
                  className="w-full resize-none rounded-lg border border-app-border px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/40"
                />
              </div>

              {formError && (
                <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[44px] flex-1 rounded-full border border-app-border text-sm font-semibold text-app-muted transition-colors hover:border-ember/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !draft.name.trim() || !draft.price}
                  className="min-h-[44px] flex-1 rounded-full bg-ember text-sm font-semibold text-on-accent shadow-glass transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}