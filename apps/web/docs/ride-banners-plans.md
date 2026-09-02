# Ride Planner, Banner Uploads & My Plans — Deliverables

## Migrations to apply (Supabase SQL editor)

Both migrations must be applied by hand — the project only has the anon key
(no service_role), so the storage bucket cannot be created via the API.

1. `packages/supabase/migrations/0011_banner_storage.sql`
   - Creates the public `banners` storage bucket with a 5 MB cap and
     jpg/png/webp MIME allowlist, plus owner-only insert/update/delete
     policies (paths are prefixed `<user-id>/`).
2. `packages/supabase/migrations/0012_reminders_and_plans.sql`
   - `notifications` table (owner RLS), `get_consumer_plans` SECURITY
     DEFINER RPC (unions confirmed reservations + paid event tickets),
     `send_day_of_reminders()` job, and a pg_cron schedule.

Until 0011 is applied, the banner upload field shows an error and the create
forms stay disabled. Until 0012 is applied, My Plans and the notification bell
return empty/quiet but the pages themselves render.

**Important**: the `get_consumer_plans` RPC joins branches → restaurants via
`business_id` (branches.business_id = restaurants.business_id), because the
branches table has no direct `restaurant_id` column. Other RPCs or queries
that need the restaurant name from a reservation should use the same pattern.

## Task 1 — Banner image uploads
- Upload field on restaurant + event create/edit forms
  (`components/BannerUploadField.tsx`): required, jpg/png/webp, 5 MB cap,
  canvas compression to ≤1600 px, live preview, direct-to-Supabase-Storage
  upload, returns the public URL.
- Server actions validate the URL against the `banners` bucket
  (`bannerUrlSchema` in `lib/validation.ts`) before insert.
- Gradient+name hero remains the fallback when a listing has no cover image.

## Task 2 — Ride planner without manual distance
- Map: Leaflet + OSM tiles (no Google) — `components/RideMap.tsx`.
- Search: Nominatim proxy at `/api/geo/search` (60 s in-memory cache,
  8 s timeout).
- Routing: OSRM proxy at `/api/geo/route` with a Haversine fallback labeled
  "straight-line estimate" when routing fails.
- Distance and duration are computed automatically; fares are read-only.
- `/api/rides/dispatch-link` builds deep links (uber/yango/lyft/feres) with
  a Google-Maps fallback.
- No manual distance entry exists anywhere in the ride flow.

## Task 3 — My Plans + tied ride booking + reminders
- `/plans` page (hidden unless signed in; Plans appears in the navbar only
  when authenticated).
- Lists upcoming/past reservations + event tickets with banner, date/time,
  and location.
- Book-a-ride window: opens **3 hours before** the plan start time and closes
  **30 minutes after** start (`lib/rideWindow.ts`). Enforced on the client
  (button disabled) and re-checked server-side in the `startPlanRide` server
  action, which reads the plan's own start time from the DB — a forged request
  cannot bypass it. The ride page is pre-filled with the plan's destination.
- Day-of reminder: pg_cron job at **`0 5 * * *`** (UTC) inserts an in-app
  notification for confirmed same-day reservations and paid same-day events.
  Notifications are surfaced in the navbar bell with an unread badge.

## New env vars / services
| Concern | Variable | Default | Notes |
| --- | --- | --- | --- |
| OSRM routing | `OSRM_BASE_URL` | `https://router.project-osrm.org` | Optional override. The public demo is rate-limited; self-host (e.g. `osrm-backend` docker image) for production reliability. |
| Nominatim geocoding | `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Optional override. Respect Nominatim's usage policy (cache + User-Agent already set). |
| Storage bucket | (none) | `banners` | Created by migration 0011; do not rename. |
| Reminder schedule | (none) | `0 5 * * *` (UTC) | pg_cron job `send-day-of-reminders` in migration 0012. |

## Verification
- `npx tsc --noEmit` in `apps/web`: passes.
- Dev server (:3001): /, /ride, /restaurants, /events, /plans all 200;
  /api/geo/search, /api/geo/route all 200.
- /api/notifications/user and /api/plans/user return 401 (expected) without an
  auth cookie.
