'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Trash2 } from 'lucide-react'
import { removeListing, setListingActive } from '@/app/dashboard/actions'
import { cn } from '@/lib/utils'

/**
 * Per-listing lifecycle controls. Pausing is reversible and acts immediately;
 * removing is not, so it opens a confirm that names what the cascade deletes
 * rather than firing on click.
 */
export function ListingActions({
  listingId,
  listingName,
  isActive,
  branchCount,
  menuItemCount,
}: {
  listingId: string
  listingName: string
  isActive: boolean
  branchCount: number
  menuItemCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)

  function toggle() {
    setError(null)
    startTransition(async () => {
      const result = await setListingActive(listingId, !isActive)
      if (!result.ok) setError(result.message)
      else router.refresh()
    })
  }

  function openConfirm() {
    openerRef.current = document.activeElement as HTMLButtonElement | null
    setError(null)
    setConfirming(true)
  }

  function closeConfirm() {
    setConfirming(false)
    setError(null)
  }

  function confirmRemove() {
    setRemoving(true)
    startTransition(async () => {
      const result = await removeListing(listingId)
      if (!result.ok) {
        setError(result.message)
        setRemoving(false)
        return
      }
      setConfirming(false)
      setRemoving(false)
      router.refresh()
    })
  }

  useEffect(() => {
    if (!confirming) return
    const panel = dialogRef.current
    if (!panel) return

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()

    function focusables() {
      return Array.from(
        panel!.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeConfirm()
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
  }, [confirming])

  const Icon = isActive ? Pause : Play

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending || confirming}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-xl border border-console-border bg-console-card px-4 text-sm font-semibold text-console-ink transition-colors hover:bg-console-bg',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Icon className="size-4" strokeWidth={2.1} />
        {pending ? 'Working…' : isActive ? 'Pause' : 'Activate'}
      </button>

      <button
        type="button"
        ref={openerRef}
        onClick={openConfirm}
        disabled={pending || confirming}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-xl border border-danger/30 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Trash2 className="size-4" strokeWidth={2.1} />
        Remove
      </button>

      {error && !confirming && (
        <p role="alert" className="w-full text-right text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Cancel"
            onClick={closeConfirm}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-listing-title"
            aria-describedby="remove-listing-body"
            className="animate-pop-in relative w-full max-w-md rounded-t-2xl border border-console-border bg-console-card p-6 text-console-ink shadow-elevate sm:rounded-2xl"
          >
            <h2 id="remove-listing-title" className="text-lg font-bold">
              Remove {listingName}?
            </h2>
            <p id="remove-listing-body" className="mt-2 text-sm leading-relaxed text-console-muted">
              {branchCount > 0 ? (
                <>
                  This also deletes its {branchCount} branch
                  {branchCount === 1 ? '' : 'es'}
                  {menuItemCount > 0
                    ? ` and ${menuItemCount} menu item${menuItemCount === 1 ? '' : 's'}`
                    : ''}
                  . This cannot be undone.
                </>
              ) : (
                'This listing will stop appearing on Explore. This cannot be undone.'
              )}
            </p>

            {error && (
              <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={removing}
                className="min-h-11 rounded-xl border border-console-border px-5 text-sm font-semibold text-console-ink transition-colors hover:bg-console-bg disabled:opacity-50"
              >
                Keep listing
              </button>
              <button
                type="button"
                ref={confirmRef}
                onClick={confirmRemove}
                disabled={removing}
                className="min-h-11 rounded-xl bg-danger px-5 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {removing ? 'Removing…' : 'Remove listing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}