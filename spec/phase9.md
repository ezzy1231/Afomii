# Phase 9: Admin Dashboard

## Skills to Use
- `dashboard-layout` — KPI cards, chart placement, overview grids
- `data-tables` — Sortable/filterable/paginated tables
- `navigation-patterns` — Sidebar nav, tabs, breadcrumbs
- `modals-and-dialogs` — Dialog/sheet/drawer, destructive confirm
- `settings-pages` — Admin settings, danger zone
- `security-auditor` — Security audits, vulnerability assessment
- `secure-code-review` — Security-focused code review

## Objective
Build the complete admin dashboard: user management, business verification, organizer verification, event moderation, reservation management, audit logs, and platform metrics.

## Access Control
- Route: `/dashboard/admin/*`
- Required role: `system_admin`
- Middleware redirects non-admins to `/auth/no-access`
- Optional: Separate admin portal on port 3001

## Files to Create

### `apps/web/app/dashboard/admin/layout.tsx`
Admin layout:
- Sidebar: Overview, Users, Businesses, Organizers, Events, Reservations, Audit, Metrics, Settings
- Admin badge
- Notification bell

### `apps/web/app/dashboard/admin/page.tsx` — Overview
Platform KPIs:
- Total users (by role)
- Total businesses/organizers (verified/pending)
- Total events (published/draft)
- Total reservations (today)
- Revenue chart

Pending verifications:
- Businesses awaiting verification
- Organizers awaiting verification
- Quick approve/reject actions

### `apps/web/app/dashboard/admin/users/page.tsx` — User Management
- User list with search, role filter, status filter
- User detail: profile, role, reservations, tickets
- Actions: change role, suspend/unsuspend
- Calls `adminSetUserRole`, `adminSetUserSuspended` server actions

### `apps/web/app/dashboard/admin/businesses/page.tsx` — Business Verification
- Pending businesses list
- Business detail: name, category, address, documents
- Approve/reject actions
- Calls `setBusinessVerification`, `adminSetBusinessActive` server actions

### `apps/web/app/dashboard/admin/businesses/[id]/page.tsx` — Business Detail
- Full business profile
- Linked restaurants/branches
- Reservation history
- Verification actions

### `apps/web/app/dashboard/admin/organizers/page.tsx` — Organizer Verification
- Pending organizers list
- Organizer detail: name, category, events
- Approve/reject actions
- Calls `adminVerifyOrganizer` server action

### `apps/web/app/dashboard/admin/organizers/[id]/page.tsx` — Organizer Detail
- Full organizer profile
- Linked events
- Ticket sales history
- Verification actions

### `apps/web/app/dashboard/admin/events/page.tsx` — Event Moderation
- All events list with status filter
- Event detail: title, organizer, tickets, revenue
- Actions: publish, unpublish, cancel
- Calls `adminModerateEvent` server action

### `apps/web/app/dashboard/admin/events/[id]/page.tsx` — Event Detail
- Full event details
- Ticket tiers with sales
- Organizer info
- Moderation actions

### `apps/web/app/dashboard/admin/reservations/page.tsx` — Reservation Management
- All reservations with filters
- Reservation detail
- Cancel action
- Calls `adminCancelReservation` server action

### `apps/web/app/dashboard/admin/reservations/[id]/page.tsx` — Reservation Detail
- Full reservation details
- User info, branch info
- Status timeline

### `apps/web/app/dashboard/admin/audit/page.tsx` — Audit Log
- Audit log viewer with filters
- Filter by: actor, action, entity type, date range
- Detail view with metadata

### `apps/web/app/dashboard/admin/metrics/page.tsx` — Platform Metrics
- `metric-card.tsx` components
- User growth over time
- Reservation volume
- Revenue trends
- Popular restaurants/events
- Date range selector

### `apps/web/app/dashboard/admin/settings/page.tsx` — Admin Settings
- Platform settings
- Email templates
- Feature flags

### `apps/web/components/dashboard/admin-actions.tsx`
Admin action components:
- Role selector dropdown
- Suspend/unsuspend toggle
- Verify/reject buttons

### `apps/web/components/dashboard/business-verification-actions.tsx`
Business verification:
- Approve button
- Reject button with reason input
- Status badge

## Server Actions

All in `apps/web/app/dashboard/actions.ts`:
- `adminSetUserRole(userId, newRole)` — Change user role via RPC
- `adminSetUserSuspended(userId, suspended)` — Suspend/unsuspend user
- `adminVerifyOrganizer(organizerId, approve)` — Verify/reject organizer
- `adminModerateEvent(eventId, action)` — Publish/unpublish/cancel event
- `adminCancelReservation(reservationId)` — Cancel any reservation
- `setBusinessVerification(businessId, approve)` — Verify/reject business
- `adminSetBusinessActive(businessId, active)` — Activate/deactivate business

## Verification Gate

- [ ] Admin overview shows platform KPIs
- [ ] User management: list, filter, change role, suspend
- [ ] Business verification: list, approve, reject
- [ ] Organizer verification: list, approve, reject
- [ ] Event moderation: list, publish, unpublish, cancel
- [ ] Reservation management: list, cancel
- [ ] Audit log viewer works
- [ ] Metrics page renders charts
- [ ] Non-admin redirected to `/auth/no-access`
- [ ] `npx tsc --noEmit` passes
