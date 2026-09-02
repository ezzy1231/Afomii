'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ConsolePageShell,
  ConsoleHeader,
  SectionTitle,
  ToggleSwitch,
  FilterChip,
  ConsoleSkeletonRow,
} from '@/components/dashboard/console'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'

type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  // Postgres column is snake_case (`is_available`); normalize on read.
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

type Branch = { id: string; name: string }

const CATEGORIES = ['Appetizers', 'Mains', 'Grills', 'Drinks', 'Desserts', 'General']

function formatETB(value: number) {
  return `ETB ${Number.isInteger(value) ? value.toLocaleString('en-US') : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function initialsTile(name: string) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-app-border   text-base font-bold text-ember">
      {initials || '?'}
    </span>
  )
}

export default function MenuPage() {
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // Add / edit modal state
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', price: '', category: 'Mains', description: '' })
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async (pBranchId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('branch_id', pBranchId)
      .order('category')
      .order('name')
    const rows = ((data ?? []) as unknown as MenuRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      category: r.category,
      isAvailable: Boolean(r.is_available),
    }))
    setItems(rows)
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: business } = await supabase
        .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
      if (!business) { setLoading(false); return }

      const { data: branchRows } = await supabase
        .from('branches').select('id, name').eq('business_id', business.id).order('created_at')
      const list = (branchRows ?? []) as Branch[]
      setBranches(list)
      if (!list.length) { setLoading(false); return }

      setBranchId(list[0].id)
      await loadItems(list[0].id)
      setLoading(false)
    }
    load()
  }, [loadItems])

  async function switchBranch(id: string) {
    setBranchId(id)
    setItems([])
    setLoading(true)
    await loadItems(id)
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setDraft({ name: '', price: '', category: activeCategory !== 'All' ? activeCategory : 'Mains', description: '' })
    setCreating(true)
  }

  function openEdit(item: MenuItem) {
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
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!branchId || !draft.name.trim() || !draft.price) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      branch_id: branchId,
      name: draft.name.trim(),
      price: parseFloat(draft.price),
      category: draft.category || 'General',
      description: draft.description.trim() || null,
    }

    let error: { message: string } | null = null
    if (editing) {
      const res = await supabase.from('menu_items').update(payload).eq('id', editing.id).select().single()
      error = res.error
      if (!error && res.data) {
        const row = res.data as unknown as MenuRow
        setItems((prev) =>
          prev.map((i) =>
            i.id === editing.id
              ? { id: row.id, name: row.name, description: row.description, price: Number(row.price), category: row.category, isAvailable: Boolean(row.is_available) }
              : i
          )
        )
      }
    } else {
      const res = await supabase.from('menu_items').insert(payload).select().single()
      error = res.error
      if (!error && res.data) {
        const row = res.data as unknown as MenuRow
        setItems((prev) => [
          ...prev,
          { id: row.id, name: row.name, description: row.description, price: Number(row.price), category: row.category, isAvailable: Boolean(row.is_available) },
        ])
      }
    }
    if (!error) closeModal()
    setSaving(false)
  }

  async function toggleAvailability(item: MenuItem) {
    const next = !item.isAvailable
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)))
    const supabase = createClient()
    // Column is `is_available`, not `isAvailable`.
    const { error } = await supabase.from('menu_items').update({ is_available: next }).eq('id', item.id)
    if (error) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !next } : i)))
  }

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((i) => i.category)))],
    [items]
  )

  const visible = items.filter(
    (i) =>
      (activeCategory === 'All' || i.category === activeCategory) &&
      (search.trim() === '' ||
        i.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (i.description ?? '').toLowerCase().includes(search.trim().toLowerCase()))
  )

  return (
    <ConsolePageShell>
      <ConsoleHeader
        eyebrow="Partner console"
        title="Menu Manager"
        subtitle="Curate what guests can order across your branches."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="min-h-[44px] rounded-full border border-dashed border-app-border px-5 text-sm font-semibold text-ember transition-colors hover:border-ember/40 hover:bg-ember/10"
          >
            ＋ Add Item
          </button>
        }
      />

      {/* Branch selector */}
      {branches.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <FilterChip key={b.id} active={b.id === branchId} onClick={() => switchBranch(b.id)}>
              {b.name}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Search */}
      <div className={cn(CONSOLE_CARD, 'flex items-center gap-3 px-4 py-3')}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-app-muted">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu items..."
          className="w-full bg-transparent text-sm text-app-fg outline-none placeholder:text-app-muted"
        />
      </div>

      {/* Category tabs */}
      {!loading && categories.length > 1 && (
        <nav aria-label="Menu categories" className="flex gap-6 overflow-x-auto border-b border-app-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors',
                activeCategory === cat
                  ? 'border-ember/40 text-ember'
                  : 'border-transparent text-app-muted hover:text-app-fg'
              )}
            >
              {cat}
            </button>
          ))}
        </nav>
      )}

      {/* Items */}
      {loading ? (
        <ConsoleSkeletonRow count={4} />
      ) : !branchId ? (
        <div className={cn(CONSOLE_CARD, 'border-dashed p-10 text-center')}>
          <p className="font-semibold">No branches yet</p>
          <p className="mt-1 text-sm text-app-muted">Create a branch first — menu items live per location.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={cn(CONSOLE_CARD, 'border-dashed p-10 text-center')}>
          <p className="font-semibold">No dishes here yet</p>
          <p className="mt-1 text-sm text-app-muted">Add your first item to build your menu.</p>
        </div>
      ) : (
        <section className="space-y-3">
          <SectionTitle>
            {activeCategory === 'All' ? 'Full menu' : activeCategory}
            <span className="ml-2 align-middle text-xs font-medium uppercase tracking-widest text-app-muted tabular-nums">
              {visible.length} items
            </span>
          </SectionTitle>
          <div className="space-y-2">
            {visible.map((item) => (
              <div
                key={item.id}
                className={cn(CONSOLE_CARD, 'flex items-center justify-between gap-3 p-4', !item.isAvailable && 'opacity-60')}
              >
                <div className="flex min-w-0 items-center gap-4">
                  {initialsTile(item.name)}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    {item.description && (
                      <p className="mt-0.5 truncate text-xs text-app-muted">{item.description}</p>
                    )}
                    <p className="mt-1  text-sm font-bold tabular-nums text-ember">
                      {formatETB(item.price)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <ToggleSwitch
                    checked={item.isAvailable}
                    onChange={() => toggleAvailability(item)}
                    label={`${item.isAvailable ? 'Hide' : 'Show'} ${item.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    className="flex size-11 items-center justify-center rounded-full text-lg leading-none text-app-muted transition-colors hover:bg-white/5 hover:text-app-fg"
                  >
                    ⋮
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add / edit modal — bottom sheet on mobile, centered dialog on desktop */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" onClick={closeModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="animate-pop-in relative w-full sm:max-w-lg glass rounded-t-xl p-6 sm:rounded-3xl safe-bottom max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h3 className=" text-xl font-bold">{editing ? 'Edit Item' : 'Add Item'}</h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-white/5 hover:text-app-fg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveItem} className="space-y-4">
              <div>
                <label htmlFor="mi-name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">Item Name</label>
                <input
                  id="mi-name"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Doro Wat Premium"
                  className="w-full rounded-lg border border-app-border  px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mi-price" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">Price</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2  text-xs font-bold text-ember">ETB</span>
                    <input
                      id="mi-price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                      placeholder="450"
                      className="w-full rounded-lg border border-app-border  py-2.5 pl-12 pr-3.5 text-sm tabular-nums text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/40"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="mi-category" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">Category</label>
                  <select
                    id="mi-category"
                    value={draft.category}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    className="w-full rounded-lg border border-app-border  px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors focus:border-ember/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="mi-desc" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-app-muted">Description</label>
                <textarea
                  id="mi-desc"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Traditional spicy chicken stew with hard-boiled egg and injera"
                  className="w-full resize-none rounded-lg border border-app-border  px-3.5 py-2.5 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted/70 focus:border-ember/40"
                />
              </div>
              {editing && (
                <div className="flex items-center justify-between rounded-lg border border-app-border  px-4 py-3">
                  <span className="text-sm font-semibold">Available for Order</span>
                  <ToggleSwitch
                    checked={editing.isAvailable}
                    onChange={(next) => {
                      setEditing({ ...editing, isAvailable: next })
                      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, isAvailable: next } : i)))
                    }}
                    label="Available for order"
                  />
                </div>
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
                  className="min-h-[44px] flex-1 rounded-full bg-ink text-sm font-semibold text-white shadow-glass transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ConsolePageShell>
  )
}