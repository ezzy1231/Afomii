'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { acceptSuggestedReservationTime } from '@/app/dashboard/actions'

export function AcceptSuggestedTime({ reservationId }: { reservationId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function accept() {
    setError(null)
    startTransition(async () => {
      const result = await acceptSuggestedReservationTime(reservationId)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <button type="button" onClick={accept} disabled={pending} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-ember px-3 text-xs font-semibold text-on-accent disabled:opacity-50">
        <Check className="size-3.5" />{pending ? 'Confirming…' : 'Accept new time'}
      </button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  )
}
