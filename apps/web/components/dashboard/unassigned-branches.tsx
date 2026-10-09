'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignBranchToListing } from '@/app/dashboard/actions'
import { CONSOLE_CARD } from '@/components/dashboard/console-shared'
import { cn } from '@/lib/utils'

type Branch = { id: string; branch_name: string; address: string | null }
type Listing = { id: string; name: string }

export function UnassignedBranches({
  branches,
  listings,
}: {
  branches: Branch[]
  listings: Listing[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    listings.length === 1 ? Object.fromEntries(branches.map((branch) => [branch.id, listings[0].id])) : {},
  )
  const [pendingBranch, setPendingBranch] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!branches.length) return null

  function assign(branchId: string) {
    const restaurantId = selected[branchId]
    if (!restaurantId) {
      setError('Choose a listing for each branch first.')
      return
    }

    setError(null)
    setPendingBranch(branchId)
    startTransition(async () => {
      const result = await assignBranchToListing(branchId, restaurantId)
      setPendingBranch(null)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className={cn(CONSOLE_CARD, 'space-y-4 p-5')}>
      <div>
        <h2 className="font-semibold">Assign existing branches</h2>
        <p className="mt-1 text-sm text-app-muted">
          These branches were created before branches belonged to a listing. Assign each one to keep its settings and menu with the right listing.
        </p>
      </div>
      {branches.map((branch) => (
        <div key={branch.id} className="flex flex-wrap items-center gap-3 border-t border-app-border pt-3">
          <div className="min-w-48 flex-1">
            <p className="text-sm font-semibold">{branch.branch_name}</p>
            {branch.address && <p className="text-xs text-app-muted">{branch.address}</p>}
          </div>
          <select
            value={selected[branch.id] ?? ''}
            onChange={(event) => setSelected((current) => ({ ...current, [branch.id]: event.target.value }))}
            disabled={!listings.length || isPending}
            aria-label={`Listing for ${branch.branch_name}`}
            className="min-h-11 min-w-52 rounded-lg border border-app-border bg-app-bg px-3 text-sm text-app-fg"
          >
            <option value="">Choose listing</option>
            {listings.map((listing) => <option key={listing.id} value={listing.id}>{listing.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => assign(branch.id)}
            disabled={!listings.length || isPending}
            className="min-h-11 rounded-full bg-ember px-4 text-sm font-semibold text-on-accent disabled:opacity-50"
          >
            {pendingBranch === branch.id ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      ))}
      {!listings.length && <p className="text-sm text-app-muted">Create a listing before assigning these branches.</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  )
}
