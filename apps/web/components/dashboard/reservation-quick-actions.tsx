'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { updateReservationStatus } from '@/app/dashboard/actions'

/**
 * Inline Confirm/Reject controls for a partner's reservation row
 * (Stitch `partner_overview` timeline pattern). Hidden once a row reaches a
 * terminal state.
 */
export function ReservationQuickActions({
  reservationId,
  status,
}: {
  reservationId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status !== 'pending' && status !== 'confirmed') return null

  function act(next: 'confirmed' | 'rejected') {
    setError(null)
    startTransition(async () => {
      const result = await updateReservationStatus(reservationId, next)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[10px] text-red-300">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => act('confirmed')}
        aria-label="Confirm reservation"
        className="flex size-8 items-center justify-center rounded-full bg-app-elevated text-app-fg transition-colors hover:bg-app-elevated disabled:opacity-50"
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act('rejected')}
        aria-label="Reject reservation"
        className="flex size-8 items-center justify-center rounded-full bg-danger/15 text-danger transition-colors hover:bg-danger/25 disabled:opacity-50"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
