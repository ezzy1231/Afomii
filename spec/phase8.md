# Phase 8: Event Organizer Dashboard

## Skills to Use
- `dashboard-layout` — KPI cards, chart placement, overview grids
- `data-tables` — Sortable/filterable/paginated tables
- `forms-and-validation` — react-hook-form + zod + shadcn Form
- `navigation-patterns` — Sidebar nav, tabs, breadcrumbs
- `billing-and-pricing` — Pricing tables, plan cards, paywalls
- `stripe-best-practices` — Ticket sales, payment processing
- `supabase-realtime` — Real-time ticket inventory

## Objective
Build the complete event organizer dashboard: overview, events, tickets, calendar, and analytics.

## Access Control
- Route: `/dashboard/organizer/*`
- Required role: `event_organizer`
- Middleware redirects non-organizers to `/`

## Files to Create

### `apps/web/app/dashboard/organizer/layout.tsx`
Organizer dashboard layout:
- Sidebar: Overview, Events, Tickets, Calendar, Analytics
- Notification bell
- Organizer name + verified badge

### `apps/web/app/dashboard/organizer/page.tsx` — Overview
KPI cards:
- Total events (upcoming/past)
- Total tickets sold
- Revenue
- Follower count

Upcoming events list:
- Title, date, tickets sold/remaining, status
- Quick actions: publish, unpublish

Self-healing: If no organizer record exists, provision from `unsafeMetadata`

### `apps/web/app/dashboard/organizer/events/page.tsx` — Events
- Grid of events with cover image, title, date, status
- "Create Event" button
- Edit/delete/publish/unpublish actions
- Calls `createEventListing`, `toggleEventActive` server actions

### `apps/web/app/dashboard/organizer/calendar/page.tsx` — Calendar
- Month view with events
- Day detail on click
- Color-coded by status
- Link to event detail

### `apps/web/app/dashboard/organizer/tickets/page.tsx` — Ticket Tiers
- `ticket-tier-form.tsx` component
- Per-event ticket tier management
- Fields: name, tier, price, quantity, sales window
- Toggle active/inactive
- Shows remaining inventory

### `apps/web/app/dashboard/organizer/tickets/actions.ts`
Server actions:
- `createTicketTier(input)` — Insert ticket type
- `updateTicketTier(input)` — Update ticket type
- `deleteTicketTier(id)` — Soft delete (set inactive)
- `getOrganizerContext()` — Returns `{ userId, profileId, organizerId }`

### `apps/web/app/dashboard/organizer/analytics/page.tsx` — Analytics
- `metric-card.tsx` components
- Tickets sold over time
- Revenue by event
- Ticket tier breakdown
- Date range selector

### `apps/web/components/dashboard/EventListingForm.tsx`
Event form fields:
- Title, category, description
- Venue name, address, city
- Lat/lng (map picker)
- Start/end date-time
- Cover image upload
- Validation via Zod

### `apps/web/components/dashboard/ticket-tier-form.tsx`
Ticket tier form:
- Event selector
- Name, tier type (general/early_bird/vip/group)
- Price, quantity total
- Sales start/end dates
- Active toggle

### `apps/web/components/dashboard/ticket-tier-manager.tsx`
Tier manager:
- List of tiers per event
- Inventory progress bar (sold/total)
- Edit/delete actions
- Quick stats: revenue, remaining

### `apps/web/components/dashboard/QRScanner.tsx`
QR code scanner for event check-in:
- Camera access via `react-qr-reader` or similar
- Scan QR code → validate against `ticket_purchases`
- Show ticket details (event, tier, quantity)
- Check-in button → update status
- Real-time check-in count

## Server Actions

### `apps/web/app/dashboard/organizer/tickets/actions.ts`
```typescript
export async function getOrganizerContext() {
  const { userId } = await auth()
  if (!userId) return { userId: null, profileId: null, organizerId: null }
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('clerk_user_id', userId).maybeSingle()
  if (!profile) return { userId, profileId: null, organizerId: null }
  const { data: organizer } = await supabase
    .from('organizers').select('id').eq('owner_id', profile.id).maybeSingle()
  return { userId, profileId: profile.id, organizerId: organizer?.id ?? null }
}
```

## Verification Gate

- [ ] Overview shows KPI cards + upcoming events
- [ ] Event CRUD works
- [ ] Calendar shows events
- [ ] Ticket tier management works
- [ ] Inventory tracking works
- [ ] Analytics page renders metrics
- [ ] QR scanner validates tickets
- [ ] Check-in updates ticket status
- [ ] Non-organizer user redirected to `/`
- [ ] `npx tsc --noEmit` passes
