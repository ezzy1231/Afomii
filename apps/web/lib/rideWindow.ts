/**
 * "Book a ride" availability window for My Plans.
 *
 * Rule: a ride can be booked for a plan starting within the next
 * RIDE_BOOK_WINDOW_HOURS hours. This is enforced on the client (button
 * disabled) AND re-checked on the server (startPlanRide action) so a
 * forged request cannot slip through.
 */

export const RIDE_BOOK_WINDOW_HOURS = 3

/** True when the given plan start time is inside the bookable ride window. */
export function isRideBookable(planStartISO: string | null, now = new Date()): boolean {
  if (!planStartISO) return false
  const start = new Date(planStartISO)
  if (Number.isNaN(start.getTime())) return false
  const ms = start.getTime() - now.getTime()
  // Allow booking from the window start until shortly after the plan begins
  // (30 min grace) so users can still grab a ride if slightly late.
  return ms > -30 * 60 * 1000 && ms <= RIDE_BOOK_WINDOW_HOURS * 60 * 60 * 1000
}

/** Human-friendly message shown when the window is closed. */
export function rideWindowHint(planStartISO: string | null): string {
  if (!planStartISO) return 'Ride booking opens closer to the date.'
  const start = new Date(planStartISO)
  const diff = start.getTime() - Date.now()
  if (diff <= 0) return 'This plan has already started.'
  if (diff <= RIDE_BOOK_WINDOW_HOURS * 60 * 60 * 1000) {
    return 'Book a ride to get there on time.'
  }
  const hours = Math.round(diff / (60 * 60 * 1000))
  return `Ride booking opens ${RIDE_BOOK_WINDOW_HOURS} hours before — about ${hours} hours to go.`
}
