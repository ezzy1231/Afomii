/**
 * Server-safe console constants/helpers.
 *
 * `components/dashboard/console.tsx` is a "use client" module — server
 * components may render its components but cannot CALL plain functions or read
 * non-serializable values from it. Anything shared between server and client
 * code lives here instead.
 */

/* The translucent base surface used across the console AND the consumer
   pages (it is the same `glass rounded-2xl` idiom as components/ui/card.tsx).

   This was previously exported as `CONSOLE_CARD`, which collided with the
   *elevated* card token of the same name in console-tokens.ts — the same
   import identifier produced two different-looking cards depending on which
   module a file happened to import from. Renamed to say what it is.
   For the bordered/shadowed console card use CONSOLE_CARD from console-tokens. */
export const CONSOLE_SURFACE =
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
