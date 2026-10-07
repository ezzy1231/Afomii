# Phase 11: Testing

## Skills to Use
- `nextjs` — Build verification, route testing
- `web-design-guidelines` — 100+ rules for a11y, performance, UX review
- `accessible-components` — WCAG AA audit, keyboard nav testing
- `performance-audit` — Bundle + CWV findings, Lighthouse audits
- `performance-profiler` — Deep performance profiling
- `ci-cd-and-automation` — Pipeline setup, quality gates
- `github-actions-builder` — GitHub Actions workflows

## Objective
Comprehensive testing: unit tests, integration tests, E2E tests, and build verification.

## Test Infrastructure

### `apps/web/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### `apps/web/playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
  },
})
```

## Unit Tests

### `apps/web/lib/__tests__/validation.test.ts`
Test all Zod schemas:
- Valid inputs pass
- Invalid inputs throw with correct error messages
- Edge cases (empty strings, max lengths, etc.)

### `apps/web/lib/__tests__/rate-limit.test.ts`
Test rate limiter:
- Allows requests under limit
- Blocks requests over limit
- Resets after window expires
- Keys by user ID or IP

### `apps/web/lib/__tests__/rideWindow.test.ts`
Test ride booking window:
- Returns true within 3 hours
- Returns false outside 3 hours
- Handles timezone edge cases

### `apps/web/lib/__tests__/rides.test.ts`
Test ride utilities:
- Haversine distance calculation
- Fare estimation for all providers
- Dispatch URL generation

### `apps/web/lib/__tests__/utils.test.ts`
Test utility functions:
- `cn()` class merging
- `formatCurrency()` ETB formatting
- `formatDate()` / `formatDateTime()`

### `apps/web/lib/__tests__/catalogue.test.ts`
Test catalogue caching:
- Returns cached data within TTL
- Fetches fresh data after TTL
- Falls back to sample data on error

## Integration Tests

### `apps/web/lib/supabase/__tests__/queries.test.ts`
Test data access layer (requires test Supabase instance):
- `getRestaurantDetail` returns correct shape
- `getEventDetail` returns correct shape
- `getConsumerReservations` returns user's reservations
- `getConsumerTickets` returns user's tickets
- `getConsumerPlans` returns unified plans
- `getUnreadNotificationCount` returns correct count

### `apps/web/lib/supabase/__tests__/rpcs.test.ts`
Test RPCs (requires test Supabase instance):
- `reserve_table` creates reservation
- `reserve_table` rejects when slot full
- `hold_ticket` decrements inventory
- `release_ticket_hold` restores inventory
- `complete_purchase` creates purchase with QR code
- `get_consumer_plans` returns unified view

## E2E Tests

### `apps/web/e2e/public-smoke.spec.ts`
Public pages load:
- Home page renders hero + sections
- Restaurants page renders catalogue
- Events page renders catalogue
- Hotels page renders catalogue
- About/Privacy/Terms render

### `apps/web/e2e/auth-flow.spec.ts`
Authentication flow:
- Sign up as customer → redirected to home
- Sign in → redirected to correct dashboard
- Sign out → redirected to home
- Protected routes redirect to sign-in

### `apps/web/e2e/reservation-flow.spec.ts`
Reservation flow:
- Navigate to restaurant detail
- Fill reservation form
- Submit reservation
- See confirmation

### `apps/web/e2e/ticket-purchase.spec.ts`
Ticket purchase flow:
- Navigate to event detail
- Select ticket tier + quantity
- Complete purchase with Stripe test card
- See QR code

### `apps/web/e2e/payment-flow.spec.ts`
Payment flow:
- Select ticket → enter card details → payment succeeds → ticket issued
- Payment failure → error message → retry
- Refund flow → cancellation → refund processed

### `apps/web/e2e/review-flow.spec.ts`
Review flow:
- Book restaurant → complete visit → leave review → review appears
- Upload photos → photos display
- Report review → admin notified

### `apps/web/e2e/hotel-booking.spec.ts`
Hotel booking flow:
- Search hotels → select room → book → confirmation
- Check availability calendar
- Cancel booking → refund

### `apps/web/e2e/group-booking.spec.ts`
Group booking flow:
- Select group size → book → invite friends → split payment
- Modify group booking
- Cancel group booking

### `apps/web/e2e/social-flow.spec.ts`
Social features:
- Follow restaurant → see in feed
- Share booking to WhatsApp → link works
- View friends' activity

### `apps/web/e2e/dashboard-access.spec.ts`
Dashboard access control:
- Customer cannot access /dashboard/restaurant
- Food business cannot access /dashboard/organizer
- Admin cannot be self-selected

## Build Verification

### `scripts/verify-build.mjs`
```javascript
// 1. Run tsc --noEmit
// 2. Run next build
// 3. Check for build errors
// 4. Verify all routes return 200 (or expected status)
// 5. Check for console errors
// 6. Generate report
```

## Verification Gate

- [ ] All unit tests pass (`npm test`)
- [ ] All integration tests pass
- [ ] All E2E tests pass (`npm run e2e`)
- [ ] `npm run build` completes without errors
- [ ] `npx tsc --noEmit` passes
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All routes return expected status codes
- [ ] No console warnings in production build
