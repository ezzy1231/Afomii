# Phase 6: User Features

## Skills to Use
- `forms-and-validation` — react-hook-form + zod + shadcn Form
- `data-tables` — Sortable/filterable/paginated tables
- `settings-pages` — Account settings, danger zone
- `notifications-and-toasts` — Toasts (sonner), inline alerts
- `empty-and-loading-states` — Skeletons, empty states, error+retry
- `modals-and-dialogs` — Dialog/sheet/drawer, focus trap
- `responsive-layout` — App shell, breakpoints
- `stripe-best-practices` — Payment flows, Stripe integration
- `supabase-realtime` — Real-time notifications, live updates
- `server-caching-handbook` — Cache tags, Redis, unstable_cache

## Objective
Build customer-facing features: reservations, reviews, My Plans, settings, hotels, and notifications.

## Files to Create

### `apps/web/components/reservation-form.tsx`
Reservation form component:
- Date picker (Gregorian/Ethiopian calendar toggle)
- Time slot selector (based on booking config + real-time availability)
- Guest count stepper
- Special requests textarea
- Availability check via `useCheckAvailability` hook
- Submit calls `createReservation` server action
- Shows confirmation code on success
- "Add to Calendar" button (Google/Apple)
- "Get a Ride" button (pre-filled destination)

Props:
```typescript
{
  branchId: string
  branchName: string
  maxGuests: number
  slotDuration: number
  bookingMode: 'instant' | 'request'
}
```

### `apps/web/components/Reviews.tsx`
Review system:
- Star rating (1-5) with interactive stars
- Review text (min 10 chars, max 500)
- Photo upload (up to 5 photos)
- Submit review → creates `reviews` row
- Show verified badge if user has booking

### `apps/web/components/ReviewList.tsx`
Review list component:
- Average rating display
- Rating distribution (5 stars, 4 stars, etc.)
- Review cards with user name, date, photos, text
- "Helpful" button
- Sort by: newest, highest, lowest

### `apps/web/components/WaitlistForm.tsx`
Waitlist form:
- Shown when no slots available
- Same fields as reservation form
- "Join Waitlist" button
- Shows position in queue
- Notification when slot opens

### `apps/web/components/GroupBookingForm.tsx`
Group booking form:
- Party size selector (10+)
- Date/time/guests
- Split payment option
- "Invite friends" (generates share link)
- Contact info for organizer

### `apps/web/components/TableSelector.tsx`
Table selection:
- Floor plan view (SVG or image)
- Available/occupied/selected states
- Tap to select table
- Special requests per table
- Accessibility options (wheelchair access)

### `apps/web/components/PreOrderForm.tsx`
Pre-order form:
- Menu item selector
- Quantity per item
- Special instructions
- Estimated ready time
- Payment at restaurant

### `apps/web/components/CalendarExport.tsx`
Calendar export:
- "Add to Google Calendar" button
- "Add to Apple Calendar" button
- Generates .ics file
- Includes reservation/event details + location

### `apps/web/components/SocialShare.tsx`
Social sharing:
- Share to WhatsApp
- Share to Facebook
- Share to Twitter/X
- Copy link
- Native share API on mobile

### `apps/web/components/LoyaltyCard.tsx`
Loyalty program:
- Current points balance
- Tier progress (Bronze → Silver → Gold → Platinum)
- Points history
- Rewards catalog
- "Redeem" button

### `apps/web/app/restaurants/actions.ts`
Server actions:
- `createReservation(input)` — Validates input, rate limits, calls `reserve_table` RPC, creates Stripe payment intent
- `cancelReservation(id)` — Updates status to cancelled, triggers refund if paid
- `createReview(input)` — Create review with photos
- `markReviewHelpful(reviewId)` — Increment helpful count
- `reportReview(reviewId, reason)` — Report inappropriate content

### `apps/web/app/plans/page.tsx` — My Plans
Auth-gated page with 3 tabs:
1. **Upcoming** — Future reservations + event tickets + hotel bookings
2. **Past** — Completed/cancelled reservations + past events
3. **Saved** — Bookmarked restaurants/events/hotels (from localStorage)

Each plan card shows:
- Type icon (restaurant/event/hotel)
- Title, date, time, location
- Status badge
- "Get a ride" button (within 3-hour window)
- "View details" link
- "Add to calendar" button

Data: `getConsumerPlans(profileId)` RPC

### `apps/web/app/plans/actions.ts`
Server actions:
- `markNotificationsRead(id?)` — Mark notifications as read
- `startPlanRide(planId, planType)` — Generate ride URL with destination

### `apps/web/app/settings/page.tsx` — Account Settings
Auth-gated page with sections:
1. **Profile** — Full name, email, phone, city, role badge
2. **Account** — Member since, sign out button
3. **Reservations** — List of user's reservations with status
4. **Tickets** — List of user's event tickets with QR codes
5. **Hotels** — List of user's hotel bookings
6. **Loyalty** — Points balance, tier, rewards

Data: `getConsumerReservations(profileId)`, `getConsumerTickets(profileId)`

### `apps/web/components/NotificationsBell.tsx`
Notification dropdown:
- Bell icon with unread count badge
- Polls `/api/notifications/user` every 30s
- Dropdown list of notifications
- Click to mark as read
- "Mark all read" button

### `apps/web/components/PlansView.tsx`
Plans view component:
- Tab bar (Upcoming / Past / Saved)
- Plan cards grid
- Empty states
- Loading skeletons

### `apps/web/lib/saved.ts`
localStorage persistence:
- `getSavedPlaces()` — Returns saved place IDs
- `toggleSavedPlace(id)` — Add/remove from saved
- `isPlaceSaved(id)` — Check if saved

### `apps/web/lib/rideWindow.ts`
Ride booking window logic:
- `isRideBookable(planDate)` — Returns true if within 3 hours of plan start
- `getTimeUntilRideWindow(planDate)` — Returns human-readable time until window opens

### `apps/web/lib/rides.ts`
Ride utilities:
- `getRideEstimates(distanceKm)` — Returns fare estimates for all providers
- `getDispatchUrl(provider, pickup, destination)` — Returns deep link URL
- `haversineDistance(lat1, lng1, lat2, lng2)` — Distance calculation
- `fetchRoute(pickup, destination)` — OSRM route with polyline

### `apps/web/lib/share.ts`
Share utilities:
- `sharePlace(title, text, url)` — Web Share API with clipboard fallback

### `apps/web/app/hotels/actions.ts`
Server actions:
- `createHotelBooking(input)` — Book hotel room with Stripe payment
- `cancelHotelBooking(id)` — Cancel booking with refund
- `getHotelAvailability(hotelId, checkIn, checkOut)` — Check room availability

### `apps/web/app/waitlist/actions.ts`
Server actions:
- `joinWaitlist(input)` — Add to waitlist
- `leaveWaitlist(id)` — Remove from waitlist
- `getWaitlistPosition(id)` — Get current position

## Verification Gate

- [ ] Reservation form shows available time slots
- [ ] Reservation creation calls RPC and shows confirmation
- [ ] Reservation cancellation works with refund
- [ ] My Plans shows upcoming/past/saved tabs
- [ ] Plan cards show correct status badges
- [ ] "Get a ride" only available within 3-hour window
- [ ] Settings shows profile, reservations, tickets, hotels, loyalty
- [ ] Notifications bell shows unread count
- [ ] Notifications mark as read on click
- [ ] Saved places persist in localStorage
- [ ] Reviews can be created and displayed
- [ ] Waitlist works when no slots available
- [ ] Group booking form works
- [ ] Table selection works
- [ ] Pre-order form works
- [ ] Calendar export works
- [ ] Social sharing works
- [ ] Loyalty program displays correctly
- [ ] Hotel booking works with Stripe
- [ ] `npx tsc --noEmit` passes
