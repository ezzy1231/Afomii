# Backend Spec — Mobile Enablement & Hardening

> Task IDs: `BE-<epic>.<n>`. Every task lists **files touched** and a **DoD**. Contracts are authoritative: the mobile app and this API are built against them in parallel.

---

## 0. Global conventions (established by Epic BE-0, then binding forever)

### 0.1 Error envelope

Every non-2xx response (global `HttpExceptionFilter`):

```json
{
  "statusCode": 409,
  "code": "RESERVATION_SLOT_FULL",
  "message": "No tables available for this time slot",
  "timestamp": "2025-01-15T18:30:00.000Z",
  "path": "/api/v1/reservations"
}
```

Stable `code` strings are part of the mobile contract (UI maps them to treatments — see 02 §7). Register codes in `apps/backend/src/common/errors/error-codes.ts`.

### 0.2 Pagination envelope

All list endpoints accept `?page=1&limit=20` (limit cap 50) and return:

```json
{ "data": [ /* items */ ], "meta": { "page": 1, "limit": 20, "total": 137, "totalPages": 7 } }
```

Helper: `common/pagination/pagination.util.ts` (`buildPaginated(data, total, page, limit)`).

### 0.3 Validation

- One `ZodValidationPipe` in `common/pipes/zod-validation.pipe.ts`; controllers annotate `@Body(new ZodValidationPipe(Schema))`. All schemas come from `@urbanexplore/shared` — no local DTO duplicates.
- Remove per-controller inline `.parse()` calls (audit item A8) so validation behavior (and its errors) is uniform.

### 0.4 Auth annotations

Every route declares access explicitly: `@Public()` or `@Roles(...)` — no silent defaults. Optional auth = `@Public()` + `OptionalCurrentUser()` decorator (needed by BE-4.1).

### 0.5 Module layout for new work

Follow existing Nest structure: `modules/<domain>/{controller,service,module}.ts`, cross-cutting in `common/`. New: `modules/devices/`, `modules/notifications/`, `modules/payments/`.

---

## Epic BE-0 — Platform hardening & seed data  · Phase M0–M1 · no deps

| Task | Description | Files | DoD |
|---|---|---|---|
| BE-0.1 | Global `HttpExceptionFilter` producing §0.1 envelope; map Prisma known errors (P2002 → 409 CODE_TAKEN, P2025 → 404) | `common/filters/http-exception.filter.ts`, register in `main.ts` | Every error from any module conforms; integration test asserts envelope on 400/401/409/404/500 |
| BE-0.2 | `ZodValidationPipe` + refactor all 6 controllers to schema-driven validation | `common/pipes/*`, all `*.controller.ts` | Invalid bodies → 400 with `VALIDATION_ERROR` + zod issue list; shared schemas are sole source |
| BE-0.3 | helmet + ThrottlerModule: global 100/min, `auth/*` 10/min, ticket hold/checkout 30/min | `main.ts`, `app.module.ts` | 429 returns envelope code `RATE_LIMITED`; tests confirm limits |
| BE-0.4 | `GET /health`: checks Prisma `SELECT 1` + Redis ping, reports component status | `modules/health/*` | `{status:'ok', db:true, redis:true}`; used by mobile smoke screen + CI deploy gate |
| BE-0.5 | Unify auth envelopes: signup/login both return `{ accessToken, refreshToken, user }` (A6) | `auth.service.ts`, `auth.controller.ts` | Contract test pins shape; mobile onboarding consumes one parser |
| BE-0.6 | **Seed script**: demo customer (+preferences), restaurant business w/ 2 branches, BookingConfig variants (one of each BookingMode), menu items, organizer + published event with GENERAL/VIP/EARLY_BIRD tiers, sample completed reservation & purchase | `packages/database/prisma/seed.ts`, add `db:seed` turbo task | `npm run db:seed` idempotent (upserts); mobile team develops against it same day |
| BE-0.7 | Request logging middleware (method, path, status, ms, userId if present) | `common/middleware/*` | Visible in dev console; p95 visible in health logs |

---

## Epic BE-1 — Customer reservations  · Phase M2 · depends BE-0

| Task | Description | Files | DoD |
|---|---|---|---|
| BE-1.1 | `GET /reservations/mine?status=&page=` — own reservations, newest first, include branch+business names/address | `reservations.controller.ts`, `.service.ts` | Contract test: other users' rows never leak; pagination envelope |
| BE-1.2 | `PATCH /reservations/:id/cancel` — owner-only; allowed from PENDING/CONFIRMED; rejects past-date reservations | same | 403 for non-owner; 409 `ALREADY_CANCELLED` on repeat; COMPLETED/REJECTED → 409 |
| BE-1.3 | Rewrite availability as **per-slot** computation honoring openingHours + slot duration (fixes A2); response gains `slots[]` | service rewrite | Each slot shows `available: bool` derived from per-slot counts; unit tests cover TIME_SLOT, REQUEST_BASED, WALK_IN_ONLY, closed-day |
| BE-1.4 | Create-path correctness: reject WALK_IN_ONLY with 400 `WALK_IN_ONLY_BRANCH`; REQUEST_BASED forces PENDING; capacity counted on exact `(branch,date,slot)` under the existing Redis lock | service | Race test: 20 concurrent creates on last table → exactly 1 success |

### Contracts

`POST /api/v1/reservations/check-availability`

```json
// request  { "branchId": "uuid", "date": "2025-03-01", "guestCount": 4 }
// response
{
  "bookingMode": "TIME_SLOT",
  "date": "2025-03-01",
  "timeSlotDurationMinutes": 90,
  "maxGuestPerTable": 6,
  "requirePrepayment": false,
  "slots": [
    { "time": "18:00", "available": true },
    { "time": "19:30", "available": false },
    { "time": "21:00", "available": true }
  ]
}
```

`PATCH /api/v1/reservations/:id/cancel` → returns updated reservation (status CANCELLED).

Error codes: `BRANCH_NOT_FOUND` 404, `NO_BOOKING_CONFIG` 400, `GUESTS_EXCEED_MAX` 400, `WALK_IN_ONLY_BRANCH` 400, `SLOT_FULL` 409, `CANCELLATION_NOT_ALLOWED` 409.

---

## Epic BE-2 — Discovery APIs  · Phase M2 · depends BE-0

| Task | Description | Files | DoD |
|---|---|---|---|
| BE-2.1 | `GET /partners/restaurants/:businessId` — profile + branches incl. full menu grouped by category + bookingConfig summary | partners controller/service | 404 envelope for unknown id; matches contract below |
| BE-2.2 | Geo ordering: when `lat`+`lng` given, `$queryRaw` PostGIS distance sort, each branch gains `distanceKm`; fallback name-sort otherwise | service + raw SQL | Integration test with seeded coords asserts ascending distances |
| BE-2.3 | Filters + pagination on list: `category`, `search`, `openNow` (computed from openingHours vs server time), page/limit (A7) | service | Envelope meta correct; openNow unit-tested across timezone edge |
| BE-2.4 | **Bug fix A1**: persist latitude/longitude/openingHours/cuisine/highlights in `addBranch` (+ zod schema already has them) | `partners.service.ts` | Regression test: create branch with geo → roundtrip readback equals input |

### Contracts

`GET /partners/restaurants?page=1&lat=9.03&lng=38.74&openNow=true`

```json
{
  "data": [{
     "id": "biz_uuid", "name": "Yod Abyssinia", "category": "Restaurant",
     "logoUrl": null, "coverUrl": null, "isVerified": true,
     "branches": [{
        "id": "br_uuid", "branchName": "Bole", "address": "...",
        "latitude": 9.010, "longitude": 38.761, "phone": "+251...",
        "distanceKm": 3.4,
        "bookingMode": "TIME_SLOT", "acceptsBookings": true
     }]
  }],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

`GET /partners/restaurants/:businessId` adds per-branch `menuItems[]` (`id,name,price,category,imageUrl,isAvailable`) and `openingHours`.

---

## Epic BE-3 — Ticketing completion  · Phase M3 · depends BE-0

| Task | Description | Files | DoD |
|---|---|---|---|
| BE-3.1 | `GET /tickets/mine?page=&upcoming=` — purchases incl. event (title, venueName, startDateTime, coverImageUrl) + ticketType (name, tier); ordered by event start | events or new `tickets` controller | Ownership enforced; pagination envelope |
| BE-3.2 | One active hold per user+tier: key `ticket_hold_user:{userId}:{ticketTypeId}` (TTL 600s) set during hold; cleared on checkout/expiry sweep. Repeat hold while active → reuse existing token (idempotent) rather than double-reserving | `events.service.ts` | Double-hold test: stock decremented once, same holdToken returned |
| BE-3.3 | **Fix A5** expired-stock restoration: maintain index set `ticket_holds_index:{ticketTypeId}` (member = holdToken, scored by expiry ts via ZADD). Sweep job (every minute, `@nestjs/schedule`) pops expired members, restores `remainingQuantity`, deletes user-hold keys. Replace dead ttl-scan implementation | service + cron module | Kill-server-during-hold test: after TTL, quantity restored exactly once (sweep is idempotent via ZPOPMIN semantics) |
| BE-3.4 | Idempotent checkout: partial unique migration — one COMPLETED purchase per `holdToken`; second checkout with same token returns original purchase (200), not a duplicate charge path | migration + service | Replay test: two rapid checkouts → single purchase row |
| BE-3.5 | **Fix A4**: detail endpoint 404s unless PUBLISHED (unless owner/admin); stop exposing organizer email publicly — return organizer display name instead | controller/service | Anonymous GET on DRAFT id → 404; public payload contains no email field |

### Contracts

`POST /events/:eventId/tickets/hold` → `{ holdToken, expiresInSeconds: 600, price, totalPaid }` (unchanged shape, now idempotent per BE-3.2).

`POST /events/:eventId/tickets/checkout`

```json
// request { "holdToken": "hex", "ticketTypeId": "uuid", "quantity": 2 }
// response (TicketPurchase)
{
  "id": "pur_uuid", "eventId": "...", "ticketTypeId": "...",
  "quantity": 2, "totalPaid": 1200, "status": "COMPLETED",
  "qrCodeHash": "sha256hex", "createdAt": "..."
}
```

`GET /tickets/mine` → paginated purchase cards (fields above + embedded event/ticketType).

Error codes: `HOLD_EXPIRED` 400, `HOLD_OWNERSHIP` 400, `INSUFFICIENT_STOCK` 400 (message carries remaining count — mobile renders it), `EVENT_NOT_ON_SALE` 400 (salesStart/SalesEnd window respected — also added here).

---

## Epic BE-4 — Rides fixes  · Phase M4 · depends BE-0

| Task | Description | Files | DoD |
|---|---|---|---|
| BE-4.1 | **Fix A3**: optional-auth on rides routes; `logSearch` uses real `userId` when authenticated, else `null`-safe anonymous log. Change `RideSearchLog.userId` to nullable in migration | rides module, migration | No more FK-swallowed writes; authenticated search stores user |
| BE-4.2 | `POST /rides/select` — persist chosen provider on the latest matching search log (contract below); completes analytics loop | controller/service | Selection appears on log row; test covers cache-hit path too |
| BE-4.3 | Provider registry from env (`RIDE_PROVIDERS=mock,uber,...`); adapters resolved via factory; Mock stays default so Expo Go demos need no partner keys | `adapters/index.ts`, config | Adding an adapter = file + env entry only |

### Contract — ride selection

```json
// POST /rides/select
{ "pickupLat": 9.01, "pickupLng": 38.76, "dropoffLat": 9.005, "dropoffLng": 38.79, "selectedPartner": "Yango" }
// → 204 No Content
```

---

## Epic BE-5 — Push notification infrastructure  · Phase M5 · depends BE-0

| Task | Description | Files | DoD |
|---|---|---|---|
| BE-5.1 | Migration: `DeviceToken { id, userId, platform: APNS\|FCM, token @unique, appId, createdAt, lastSeenAt }` | `schema.prisma` + migration | `db:migrate` clean on fresh compose volume |
| BE-5.2 | `POST /devices` (auth) upsert token; `DELETE /devices/:token` on logout | `modules/devices/*` | Same token re-register updates `lastSeenAt`, not duplicates |
| BE-5.3 | `NotificationsService` wrapping expo-server-sdk: fan-out to all of a user's tokens; receipt-error pruning of dead tokens | `modules/notifications/*` | Unit test with mocked SDK; dead-token pruned after receipt error |
| BE-5.4 | Transactional emits: reservation CONFIRMED/REJECTED (from partner status change), ticket purchase COMPLETED, hold-expiry warning at T-2min (cron scans index set from BE-3.3), event reminder T-24h | hooks in existing services + crons | Integration tests assert one push per event per device |

Payload contract (mobile routes on it — see 02 §7):

```json
{ "title": "Reservation confirmed", "body": "Yod Abyssinia · Bole · Fri 19:30", "data": { "type": "reservation.confirmed", "reservationId": "uuid" } }
```

---

## Epic BE-6 — Payments (Stripe)  · post-M5 · gated on decision Q1

| Task | Description | DoD |
|---|---|---|
| BE-6.1 | When branch/event requires prepayment, checkout responds `{ paymentRequired: true, clientSecret }` creating a Stripe PaymentIntent for `totalPaid`; without prepayment behavior unchanged (free-confirm) | Mobile can branch on `paymentRequired` |
| BE-6.2 | `POST /payments/webhook` (raw-body, signature verified): on succeeded intent → purchase CONFIRMED + emit push; on failure → release hold stock | Replay-protected; signature failure → 400 envelope |
| BE-6.3 | Refund path on cancellation inside policy window | Status REFUNDED + webhook to Stripe |

---

## Migration ledger (in order)

| # | Migration | Epic | Notes |
|---|---|---|---|
| 1 | `ride_search_log_user_nullable` | BE-4.1 | drop nothing; make FK column nullable |
| 2 | `unique_completed_purchase_per_hold` | BE-3.4 | partial unique index `WHERE status='COMPLETED' AND holdToken IS NOT NULL` |
| 3 | `device_tokens` | BE-5.1 | unique token |
| 4 | `event_organizer_name_denorm` (optional) | BE-3.5 | store organizer display name on Event to avoid joining User for public payloads |

## Testing matrix

| Suite | Tooling | Coverage floor | Must-have cases |
|---|---|---|---|
| Unit (services) | Jest | 80% on changed services | per-slot availability math; badge assignment; distance sort; hold reconciliation idempotency |
| Integration (controllers + test DB + redis) | Jest + supertest, docker-compose test profile | every new endpoint | ownership isolation (mine/cancel/tickets), race: last-table + last-ticket, envelope shapes, rate-limit 429s |
| E2E smoke | jest-e2e against seeded stack | happy paths | signup→login→refresh→logout; hold→checkout→tickets/mine |