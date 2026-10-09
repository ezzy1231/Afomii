'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Trash2 } from 'lucide-react'
import { removeBranch, setBranchActive } from '@/app/dashboard/actions'
import { cn } from '@/lib/utils'

/**
 * Per-location lifecycle controls, mirroring the listing controls so the two
 * levels of the console behave identically. Pause is reversible; remove opens
 * a confirm because the cascade takes the menu with it.
 */
export function BranchActions({
  branchId,
  branchName,
  isActive,
  dishCount,
}: {
  branchId: string
  branchName: string
  isActive: boolean
  dishCount: number
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
      const result = await setBranchActive(branchId, !isActive)
      if (!result.ok) setError(result.message)
      else router.refresh()
    })
  }

  function closeConfirm() {
    setConfirming(false)
    setError(null)
  }

  function confirmRemove() {
    setRemoving(true)
    startTransition(async () => {
      const result = await removeBranch(branchId)
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
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={pending || confirming}
        className={cn(
          'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-console-border bg-console-card px-3 text-xs font-semibold text-console-ink transition-colors hover:bg-console-bg',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.2} />
        {pending ? 'Working…' : isActive ? 'Pause' : 'Activate'}
      </button>

      <button
        type="button"
        ref={openerRef}
        onClick={() => {
          setError(null)
          setConfirming(true)
        }}
        disabled={pending || confirming}
        className={cn(
          'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-danger/30 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/10',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <Trash2 className="size-3.5" strokeWidth={2.2} />
        Remove
      </button>

      {error && !confirming && (
        <p role="alert" className="w-full px-4 pb-2 text-xs font-medium text-danger">
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
            aria-labelledby="remove-branch-title"
            aria-describedby="remove-branch-body"
            className="animate-pop-in relative w-full max-w-md rounded-t-2xl border border-console-border bg-console-card p-6 text-console-ink shadow-elevate sm:rounded-2xl"
          >
            <h2 id="remove-branch-title" className="text-lg font-bold">
              Remove {branchName}?
            </h2>
            <p id="remove-branch-body" className="mt-2 text-sm leading-relaxed text-console-muted">
              {dishCount > 0 ? (
                <>
                  Its {dishCount} menu item{dishCount === 1 ? '' : 's'} and reservation history go
                  with it. Consider pausing the location instead — that keeps everything and takes
                  it off the public listing.
                </>
              ) : (
                'Its reservation history goes with it. This cannot be undone.'
              )}
            </p>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger"
              >
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
                Keep location
              </button>
              <button
                type="button"
                ref={confirmRef}
                onClick={confirmRemove}
                disabled={removing}
                className="min-h-11 rounded-xl bg-danger px-5 text-sm font-semibold text-white transition-colors hover:brightness-110 disabled:opacity-50"
              >
                {removing ? 'Removing…' : 'Remove location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}