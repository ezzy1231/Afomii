'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  adminCancelReservation,
  adminModerateEvent,
  adminSetBusinessActive,
  adminSetUserSuspended,
  adminSetUserRole,
  adminVerifyOrganizer,
  setBusinessVerification,
} from '@/app/dashboard/actions'

/**
 * Client controls for the admin panel's inline mutations. Each wraps a guarded
 * server action with useTransition + router.refresh(), matching the console's
 * ReservationQuickActions pattern.
 */

function ActionError({ message }: { message: string | null }) {
  if (!message) return null
  return <span role="alert" className="text-[10px] text-danger">{message}</span>
}

function ActionSuccess({ message }: { message: string | null }) {
  if (!message) return null
  return <span role="status" className="text-[10px] text-success">{message}</span>
}

const pill =
  'min-h-11 rounded-full border px-3.5 text-xs font-semibold uppercase tracking-wide transition-colors disabled:opacity-50'
const pillOk = `${pill} border-success/40 bg-success/15 text-success hover:bg-success/25`
const pillBad = `${pill} border-danger/40 bg-danger/15 text-danger hover:bg-danger/25`
const pillNeutral = `${pill} border-app-border bg-transparent text-app-muted hover:border-ember/30`

export function BusinessLifecycleActions({
  businessId,
  status,
}: {
  businessId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function run(approve: boolean) {
    setError(null)
    setSuccess(null)
    if (!approve && !window.confirm('Reject this business verification request?')) return
    startTransition(async () => {
      const result = await setBusinessVerification(businessId, approve)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <ActionError message={error} />
      <ActionSuccess message={success} />
      {status === 'pending' && (
        <button type="button" disabled={pending} onClick={() => run(true)} className={pillOk}>
          Verify
        </button>
      )}
      {status === 'rejected' && (
        <button type="button" disabled={pending} onClick={() => run(true)} className={pillOk}>
          Approve &amp; activate
        </button>
      )}
      {(status === 'active' || status === 'pending') && (
        <button type="button" disabled={pending} onClick={() => run(false)} className={pillBad}>
          Reject
        </button>
      )}
    </div>
  )
}

export function OrganizerVerificationActions({
  organizerId,
  status,
}: {
  organizerId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function act(approve: boolean) {
    setError(null)
    setSuccess(null)
    if (!approve && !window.confirm('Reject this organizer verification?')) return
    startTransition(async () => {
      const result = await adminVerifyOrganizer(organizerId, approve)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <ActionError message={error} />
      <ActionSuccess message={success} />
      {(status === 'pending' || status === 'rejected') && (
        <>
          <button type="button" disabled={pending} onClick={() => act(true)} className={pillOk}>
            Verify
          </button>
          <button type="button" disabled={pending} onClick={() => act(false)} className={pillBad}>
            Reject
          </button>
        </>
      )}
    </div>
  )
}

export function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function change(next: string) {
    if (next === currentRole) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await adminSetUserRole(userId, next)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <select
        value={currentRole}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        aria-label="User role"
        className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-xs text-app-fg outline-none transition-colors focus:border-ember/50 disabled:opacity-50"
      >
        <option value="customer">customer</option>
        <option value="food_business">food_business</option>
        <option value="event_organizer">event_organizer</option>
        <option value="system_admin">system_admin</option>
      </select>
      <ActionError message={error} />
      <ActionSuccess message={success} />
    </span>
  )
}

export function EventModerationActions({
  eventId,
  status,
}: {
  eventId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function act(action: 'publish' | 'unpublish' | 'cancel') {
    setError(null)
    setSuccess(null)
    if (action === 'cancel' && !window.confirm('Cancel this event?')) return
    startTransition(async () => {
      const result = await adminModerateEvent(eventId, action)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <ActionError message={error} />
      <ActionSuccess message={success} />
      {(status === 'draft' || status === 'cancelled') && (
        <button type="button" disabled={pending} onClick={() => act('publish')} className={pillOk}>
          Publish
        </button>
      )}
      {status === 'published' && (
        <button type="button" disabled={pending} onClick={() => act('unpublish')} className={pillNeutral}>
          Unpublish
        </button>
      )}
      {(status === 'published' || status === 'draft') && (
        <button type="button" disabled={pending} onClick={() => act('cancel')} className={pillBad}>
          Cancel
        </button>
      )}
    </div>
  )
}

export function ReservationCancelAction({
  reservationId,
  status,
}: {
  reservationId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function cancel() {
    setError(null)
    setSuccess(null)
    if (!window.confirm('Cancel this reservation?')) return
    startTransition(async () => {
      const result = await adminCancelReservation(reservationId)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  if (success) return <span role="status" className="text-xs font-medium text-success">{success}</span>
  if (status !== 'pending' && status !== 'confirmed') return null

  return (
    <span className="flex items-center gap-2">
      <ActionError message={error} />
      <ActionSuccess message={success} />
      <button type="button" disabled={pending} onClick={cancel} className={pillBad}>
        Cancel booking
      </button>
    </span>
  )
}

export function UserSuspensionActions({
  userId,
  isSuspended,
}: {
  userId: string
  isSuspended: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function toggle() {
    setError(null)
    setSuccess(null)
    if (!isSuspended && !window.confirm('Suspend this user?')) return
    startTransition(async () => {
      const result = await adminSetUserSuspended(userId, !isSuspended)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <ActionError message={error} />
      <ActionSuccess message={success} />
      {isSuspended ? (
        <button type="button" disabled={pending} onClick={toggle} className={pillOk}>
          Reinstate
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={toggle} className={pillBad}>
          Suspend
        </button>
      )}
    </span>
  )
}

export function BusinessSuspendAction({
  businessId,
  status,
}: {
  businessId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // moderation_status has no 'suspended'; suspension maps to 'inactive'.
  const suspended = status === 'inactive'
  if (status === 'pending' || status === 'rejected') return null

  function toggle() {
    setError(null)
    setSuccess(null)
    if (!suspended && !window.confirm('Suspend this business?')) return
    startTransition(async () => {
      const result = await adminSetBusinessActive(businessId, suspended)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setSuccess(result.message)
      router.refresh()
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <ActionError message={error} />
      <ActionSuccess message={success} />
      {suspended ? (
        <button type="button" disabled={pending} onClick={toggle} className={pillOk}>
          Reactivate
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={toggle} className={pillNeutral}>
          Suspend
        </button>
      )}
    </span>
  )
}
