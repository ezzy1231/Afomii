'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setBusinessVerification } from '@/app/dashboard/actions'

/**
 * Inline Verify/Reject controls for the admin console's pending-verification
 * rows (Stitch `admin_dashboard` pattern). Hidden once a decision is stored.
 */
export function BusinessVerificationActions({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) return null

  function act(approve: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await setBusinessVerification(businessId, approve)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setDone(true)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[10px] text-[#ff8a80]">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => act(true)}
        className="min-h-[36px] rounded-full border border-[#34A853]/50 bg-[#34A853]/15 px-4 text-xs font-semibold uppercase tracking-wide text-[#7bd88f] transition-colors hover:bg-[#34A853]/30 disabled:opacity-50"
      >
        Verify
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act(false)}
        className="min-h-[36px] rounded-full border border-[#BA1A1A]/50 bg-[#BA1A1A]/20 px-4 text-xs font-semibold uppercase tracking-wide text-[#ff8a80] transition-colors hover:bg-[#BA1A1A]/40 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}
