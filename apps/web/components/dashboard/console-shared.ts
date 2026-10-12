/**
 * Server-safe console constants/helpers.
 *
 * `components/dashboard/console.tsx` is a "use client" module — server
 * components may render its components but cannot CALL plain functions or read
 * non-serializable values from it. Anything shared between server and client
 * code lives here instead.
 */

export const CONSOLE_CARD =
  'glass rounded-2xl'

export type StatusTone = 'ok' | 'bad' | 'gold' | 'info'

export function statusTone(status: string): StatusTone {
  // `approved` / `in_review` / `needs_info` are verification_request_status
  // values; they share colours with the older moderation_status ones.
  switch (status) {
    case 'confirmed':
    case 'active':
    case 'paid':
    case 'approved':
      return 'ok'
    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'failed':
    case 'inactive':
      return 'bad'
    case 'completed':
    case 'pending':
    case 'draft':
    case 'in_review':
    case 'needs_info':
      return 'gold'
    default:
      return 'info'
  }
}
