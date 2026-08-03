'use client'

import { useState } from 'react'
import { TicketTierManager } from '@/components/dashboard/ticket-tier-form'
import { Button } from '@/components/ui/button'

type TicketTier = {
  id: string
  name: string
  tier: string
  price: string
  totalQuantity: string
  salesStart: string
  salesEnd: string
}

export default function TicketsPage() {
  const [tiers, setTiers] = useState<TicketTier[]>([])
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gold">Organizer</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-app-fg">Ticket Management</h1>
      <p className="mt-2 text-sm text-app-muted">
        Configure ticket tiers and pricing for your events.
      </p>

      <div className="mt-8">
        <TicketTierManager tiers={tiers} onChange={setTiers} />
      </div>

      {tiers.length > 0 && (
        <div className="mt-8 flex items-center gap-4">
          <Button onClick={handleSave}>Save Ticket Tiers</Button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium animate-pop-in">
              Ticket tiers saved successfully.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
