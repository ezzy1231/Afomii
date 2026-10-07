# Phase 7: Restaurant Partner Dashboard

## Skills to Use
- `dashboard-layout` — KPI cards, chart placement, overview grids
- `data-tables` — Sortable/filterable/paginated tables
- `forms-and-validation` — react-hook-form + zod + shadcn Form
- `navigation-patterns` — Sidebar nav, tabs, breadcrumbs
- `empty-and-loading-states` — Skeletons, empty states
- `modals-and-dialogs` — Dialog/sheet/drawer, destructive confirm
- `supabase-realtime` — Real-time reservation updates
- `observability-and-instrumentation` — Analytics instrumentation

## Objective
Build the complete restaurant partner dashboard: overview, listings, branches, menu, reservations, and analytics.

## Access Control
- Route: `/dashboard/restaurant/*`
- Required role: `food_business`
- Middleware redirects non-owners to `/`

## Files to Create

### `apps/web/app/dashboard/layout.tsx`
Dashboard root layout:
- Sidebar navigation
- Mobile tab strip
- Auth check via middleware

### `apps/web/app/dashboard/restaurant/layout.tsx`
Restaurant dashboard layout:
- Sidebar: Overview, Listings, Branches, Menu, Reservations, Analytics
- Notification bell
- Business name + verified badge

### `apps/web/app/dashboard/restaurant/page.tsx` — Overview
KPI cards:
- Total reservations (today/week/month)
- Total profile views
- Follower count
- Occupancy rate

Today's reservations list:
- Time, guest count, status, branch
- Quick actions: confirm, reject

Self-healing: If no business record exists, provision from `unsafeMetadata`

### `apps/web/app/dashboard/restaurant/listings/page.tsx` — Listings
- Grid of restaurant listings with cover image, name, cuisine, status
- "Add Listing" button → `/dashboard/restaurant/listings/new`
- Edit/delete actions per listing

### `apps/web/app/dashboard/restaurant/listings/new/page.tsx` — Create Listing
- `RestaurantListingForm` component
- Fields: name, cuisine, area label, city, closing label, cover image upload
- Calls `createRestaurantListing` server action
- Redirects to listings on success

### `apps/web/app/dashboard/restaurant/branches/page.tsx` — Branches
- `branch-manager.tsx` component
- List of branches with booking config
- Add branch: name, address, lat/lng, phone
- Edit booking config: mode, tables, max guests, slot duration, advance notice, capacity

### `apps/web/app/dashboard/restaurant/menu/page.tsx` — Menu
- Tabbed by branch
- Menu items grouped by category
- Add/edit/delete menu items
- Toggle availability
- Fields: name, description, price, category, image

### `apps/web/app/dashboard/restaurant/reservations/page.tsx` — Reservations
- Filter bar: date, status, branch
- Reservation list with guest info, time, status
- `reservation-quick-actions.tsx`: confirm/reject buttons
- `reservation-calendar.tsx`: calendar grid view
- Calls `updateReservationStatus` server action

### `apps/web/app/dashboard/restaurant/analytics/page.tsx` — Analytics
- `metric-card.tsx` components
- Views: profile views, listing views, reservation conversion
- Revenue chart (from reservations)
- Popular time slots
- Date range selector

### `apps/web/components/dashboard/RestaurantListingForm.tsx`
Form fields:
- Name, cuisine, area label, city, closing label
- Cover image upload via `BannerUploadField`
- Validation via Zod

### `apps/web/components/dashboard/branch-manager.tsx`
Branch management:
- Branch list with edit/delete
- Add branch form
- Booking config form per branch
- Map picker for lat/lng

### `apps/web/components/dashboard/reservation-quick-actions.tsx`
Inline actions:
- Confirm button (pending → confirmed)
- Reject button (pending → cancelled)
- Complete button (confirmed → completed)
- No-show button (confirmed → no_show)

### `apps/web/components/dashboard/reservation-calendar.tsx`
Calendar grid:
- Month view with reservation counts
- Day detail on click
- Color-coded by status

### `apps/web/components/dashboard/metric-card.tsx`
KPI card:
- Label, value, delta (vs previous period)
- Icon
- Trend indicator

### `apps/web/components/BannerUploadField.tsx`
Image upload:
- File picker with drag-and-drop
- Client-side compression
- Upload to Supabase Storage `banners` bucket
- Preview with crop
- Returns public URL

## Server Actions

### `apps/web/app/dashboard/actions.ts`
Key actions:
- `createRestaurantListing` — Insert restaurant
- `addBranch` — Insert branch + booking config
- `updateBranchBookingConfig` — Upsert booking config
- `updateReservationStatus` — Update reservation status
- `updateRestaurantHours` — Update opening hours
- `setBusinessVerification` — Admin only

## Verification Gate

- [ ] Overview shows KPI cards + today's reservations
- [ ] Listings CRUD works
- [ ] Branch + booking config management works
- [ ] Menu item CRUD works
- [ ] Reservation list with filters works
- [ ] Quick actions update reservation status
- [ ] Calendar view shows reservations
- [ ] Analytics page renders metrics
- [ ] Image upload works
- [ ] Non-food-business user redirected to `/`
- [ ] `npx tsc --noEmit` passes
