'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  isAvailable: boolean
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: business } = await supabase
        .from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
      if (!business) { setLoading(false); return }

      const { data: branches } = await supabase
        .from('branches').select('id').eq('business_id', business.id)
      if (!branches?.length) { setLoading(false); return }

      setBranchId(branches[0].id)
      const { data } = await supabase
        .from('menu_items').select('*').eq('branch_id', branches[0].id).order('category')
      if (data) setItems(data)
      setLoading(false)
    }
    load()
  }, [])

  async function addItem() {
    if (!branchId || !newItem.name || !newItem.price) return
    const supabase = createClient()
    const { data } = await supabase.from('menu_items').insert({
      branch_id: branchId,
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category || 'General',
    }).select().single()

    if (data) {
      setItems((prev) => [...prev, data])
      setNewItem({ name: '', price: '', category: '' })
    }
  }

  async function toggleAvailability(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('menu_items').update({ isAvailable: !current }).eq('id', id)
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isAvailable: !current } : i))
  }

  const categories = [...new Set(items.map((i) => i.category))]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Restaurant</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Menu Management</h1>
      <p className="mt-2 text-sm text-app-muted">Add and manage your menu items.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem(p => ({ ...p, name: e.target.value }))} />
        <Input placeholder="Price" type="number" value={newItem.price} onChange={(e) => setNewItem(p => ({ ...p, price: e.target.value }))} />
        <Input placeholder="Category (e.g. Main Course)" value={newItem.category} onChange={(e) => setNewItem(p => ({ ...p, category: e.target.value }))} />
      </div>
      <Button onClick={addItem} className="mt-4">Add Menu Item</Button>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--bg-input)]" />)}
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {categories.length === 0 && (
            <p className="text-sm text-app-muted">No menu items yet. Add your first item above.</p>
          )}
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">{cat}</h3>
              <div className="space-y-2">
                {items.filter((i) => i.category === cat).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                    <div>
                      <p className="font-medium text-app-fg">{item.name}</p>
                      <p className="text-xs text-app-muted">${item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => toggleAvailability(item.id, item.isAvailable)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isAvailable ? 'bg-success/15 text-success' : 'bg-app-input text-app-muted'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
