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
  switch (status) {
    case 'confirmed':
    case 'active':
    case 'paid':
      return 'ok'
    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'failed':
      return 'bad'
    case 'completed':
      return 'gold'
    default:
      return 'info'
  }
}
