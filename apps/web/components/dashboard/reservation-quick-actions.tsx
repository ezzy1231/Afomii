'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { suggestReservationTime, updateReservationStatus } from '@/app/dashboard/actions'

/**
 * Partner controls for pending reservation requests. Instant bookings arrive
 * confirmed and use the separate check-in workflow.
 */
export function ReservationQuickActions({
  reservationId,
  status,
  suggestedTime,
}: {
  reservationId: string
  status: string
  suggestedTime?: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [time, setTime] = useState(suggestedTime ?? '')

  if (status !== 'pending') return null

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

  function submitSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await suggestReservationTime(reservationId, time)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuggesting(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
      {error && <span className="text-[10px] text-[#C42B1C]">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => act('confirmed')}
        aria-label="Confirm reservation"
        className="flex size-8 items-center justify-center rounded-full bg-console-mint text-console-mint-ink transition-colors hover:brightness-95 disabled:opacity-50"
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act('rejected')}
        aria-label="Reject reservation"
        className="flex size-8 items-center justify-center rounded-full bg-console-blush text-console-blush-ink transition-colors hover:brightness-95 disabled:opacity-50"
      >
        <X className="size-4" />
      </button>
      {status === 'pending' && (
        <button type="button" onClick={() => setSuggesting((open) => !open)} className="min-h-8 rounded-full border border-console-border px-3 text-[11px] font-semibold text-console-indigo hover:bg-console-bg">
          {suggestedTime ? 'Change time' : 'Suggest time'}
        </button>
      )}
      </div>
      {suggestedTime && !suggesting && <span className="text-[10px] font-medium text-console-indigo">Suggested {suggestedTime}</span>}
      {suggesting && (
        <form onSubmit={submitSuggestion} className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`suggest-time-${reservationId}`}>Suggested time</label>
          <input id={`suggest-time-${reservationId}`} type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="min-h-9 rounded-lg border border-console-border bg-white px-2 text-xs text-console-ink" />
          <button type="submit" disabled={pending || !time} className="min-h-9 rounded-lg bg-console-indigo px-3 text-xs font-semibold text-white disabled:opacity-50">Send</button>
        </form>
      )}
    </div>
  )
}
