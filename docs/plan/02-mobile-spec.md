# Mobile App Spec — FoodRide Customer App (iOS & Android)

> Task IDs `FE-<epic>.<n>`, mapped to epics in the master plan §5. Expo Go is the dev viewer; nothing in this spec requires custom native code before INF-2.

---

## 1. App identity

| Item | Value |
|---|---|
| Name | FoodRide |
| Scheme | `foodride://` (expo-router) |
| Bundle IDs | `com.foodride.app` (+ `.dev` suffix on development builds) |
| Icons/splash | Brand navy background, gold mark; adaptive icon for Android |
| Min OS | iOS 15.1 / Android 8 (Expo SDK 53 floors) |

## 2. Scaffold & repository layout (Epic INF-1)

Procedure: `npx create-expo-app@latest foodride-mobile --template tabs` in temp → merge into `apps/mobile` keeping name `@urbanexplore/mobile`. This pins a coherent SDK/RN version set instead of hand-assembling.

```
apps/mobile/
├─ app.config.ts              # expo config: scheme, icons, plugins, extra.eas
├─ metro.config.js            # monorepo watchFolders + nodeModulesPaths
├─ babel.config.js            # nativewind preset + reanimated plugin
├─ tailwind.config.js         # extends packages/config-tailwind tokens
├─ .env.local.example         # EXPO_PUBLIC_API_URL=http://192.168.x.x:4000/api/v1
├─ app/                       # expo-router routes (thin — screens import from src/)
│  ├─ _layout.tsx             # root: providers, auth gate, fonts, splash
│  ├─ (auth)/welcome.tsx  (auth)/sign-in.tsx  (auth)/sign-up.tsx
│  ├─ (tabs)/_layout.tsx      # Home · Reserve · Events · Rides · Profile
│  ├─ (tabs)/index.tsx        # Home
│  ├─ (tabs)/reserve.tsx      # restaurant search entry
│  ├─ (tabs)/events.tsx       # events list
│  ├─ (tabs)/rides.tsx        # ride search
│  ├─ (tabs)/profile.tsx      # profile hub
│  ├─ restaurant/[id].tsx
│  ├─ booking/[branchId]/index.tsx     # date+guests+slots
│  ├─ booking/[branchId]/review.tsx    # confirm
│  ├─ booking/success.tsx              # modal presentation
│  ├─ reservations/index.tsx  reservations/[id].tsx
│  ├─ event/[id].tsx          event/[id]/checkout.tsx
│  ├─ tickets/index.tsx       tickets/[purchaseId].tsx   # QR fullscreen
│  └─ profile/edit.tsx  profile/preferences.tsx  profile/settings.tsx
└─ src/
   ├─ api/                   # axios instance, interceptors, endpoint fns
   │  ├─ client.ts  endpoints/{auth,users,restaurants,reservations,events,tickets,rides}.ts
   ├─ hooks/queries/         # use-restaurants.ts, use-availability.ts, ... (query factories)
   ├─ stores/                # auth-store.ts (zustand persist→SecureStore), settings-store.ts
   ├─ theme/                 # tokens.ts, colors.ts, typography.ts
   ├─ components/ui/         # design-system primitives (§4)
   ├─ features/<domain>/     # screen bodies + domain components
   ├─ lib/                   # dates.ts, money.ts, haptics.ts, location.ts, errors.ts
   └─ i18n/                  # en.json catalogs + t() helper
```

Wiring checklist (INF-1 DoD): metro watches workspace root; `@urbanexplore/shared` in `transpilePackages`; tsconfig extends `@urbanexplore/tsconfig/react-native.json`; eslint uses shared RN config; CI runs `tsc --noEmit` + lint on PR.

---

## 3. Route table (expo-router typed routes)

| Route | Screen | Params | Auth | Notes |
|---|---|---|---|---|
| `(auth)/welcome` | Onboarding carousel | — | public | shown once (settings-store flag) |
| `(auth)/sign-in` · `sign-up` | Auth forms | redirect?: string | public | role fixed CUSTOMER in consumer build |
| `(tabs)/index` | Home feed | — | guarded | nearby + featured + quick actions |
| `(tabs)/reserve` | Restaurant explore | — | guarded | list ⇄ map toggle, filters |
| `restaurant/[id]` | Restaurant detail | id | guarded | branch selector + menu preview |
| `booking/[branchId]` | Date/guests/slots | branchId | guarded | slot grid from availability API |
| `booking/[branchId]/review` | Review & confirm | state via params store | guarded | special requests, policy text |
| `booking/success` | Confirmation modal | reservationId | guarded | code display, add-to-calendar |
| `reservations/index` `[id]` | My reservations | — | guarded | cancel action w/ policy copy |
| `(tabs)/events` · `event/[id]` | Events browse/detail | id | guarded | tier cards w/ remaining counts |
| `event/[id]/checkout` | Hold countdown + pay | ticketTypeId, qty | guarded | 10:00 countdown ring |
| `tickets/index` `[purchaseId]` | Wallet + QR detail | purchaseId | guarded | brightness boost on QR screen |
| `(tabs)/rides` | Ride search/results | — | guarded | pickers + estimate cards |
| `(tabs)/profile` + subpages | Profile hub/edit/preferences/settings | — | guarded | §6 screens 14–17 |

Auth gate: root `_layout` reads auth-store hydration; unauthenticated deep-link into a guarded route redirects to `(auth)/sign-in?redirect=<path>` and returns after login.

---

## 4. Design system (Epic FE-1)

### 4.1 Tokens (`src/theme/tokens.ts`, mirrored into tailwind.config)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg` | Ivory `#F8F5F0` | Navy-950 `#060F1D` | screens |
| `surface` | White | Navy-900 `#0B1F3A` | cards, sheets |
| `primary` | Navy `#0B1F3A` | Ivory text-on-gold contexts | buttons, tab bar active |
| `accent` | Gold `#C2A878` | Gold | CTAs, highlights, badges |
| `text` | Navy | Ivory | primary text |
| `mutedText` | Navy @55% | Ivory @55% | secondary text |
| `danger` `#C0392B` · `success` `#2E7D32` · `warning` `#B7791F` | semantic, both modes | status pills, destructive actions |

- Spacing scale 4-base: `1=4px … 16=64px`; radii: sm 8 / md 12 / lg 20 / pill 999.
- Type scale (system font stack): display 28/bold, title 22/bold, heading 17/semibold, body 15, caption 13, micro 11 uppercase tracking.
- Dark mode follows device by default; manual override persisted in settings-store.

### 4.2 Component inventory (build order = table order)

| Component | Key props | Notes |
|---|---|---|
| Button | variant solid/accent/outline/ghost, size, loading, disabled | single press handler w/ haptic |
| TextField | label, error, secure, keyboardType, prefix | error from zod issues |
| Card / ListRow | pressable, chevron | base surfaces everywhere |
| Chip (selectable) | selected, onPress | filters + preferences |
| Badge / StatusPill | tone | CONFIRMED gold, PENDING warning, CANCELLED muted… |
| Skeleton | variant row/card/map | matches final layout per screen |
| EmptyState | icon, title, body, cta | every list screen |
| Toast | tone, message | maps API error codes §7 |
| BottomSheet | snap points | filters, dispatch handoff |
| CountdownRing | secondsTotal, remaining | checkout hold TTL |
| QRCodeView | value(hash), size | wallet detail, fullscreen |
| MapPinPicker | onSelect(coord,address) | rides pickup/dropoff |
| SlotGrid | slots[], onSelect | booking step 2 |
| GuestStepper | min/max | booking step 1 |
| SectionHeader | title, action | home/list sections |

---

## 5. State & data layer (Epic FE-2 core, reused forever)

### 5.1 API client (`src/api/client.ts`)

- axios instance: baseURL `process.env.EXPO_PUBLIC_API_URL`; request interceptor injects access token.
- Response interceptor on 401: push request to queue → **single-flight** `POST /auth/refresh` with refresh token from SecureStore → replay queued requests once → on refresh failure: clear auth-store, redirect to sign-in.
- Normalizer converts API error envelope (01 §0.1) into typed `ApiError { statusCode, code, message }` so UI switches on stable codes.

### 5.2 Query key factory (`src/hooks/queries/keys.ts`) — single source

```ts
export const qk = {
  restaurants: (f: Filters) => ['restaurants', f],
  restaurant: (id: string) => ['restaurant', id],
  availability: (b: string, d: string, g: number) => ['availability', b, d, g],
  myReservations: (status?: string) => ['reservations', 'mine', status],
  events: (f: EventFilters) => ['events', f],
  event: (id: string) => ['event', id],
  myTickets: () => ['tickets', 'mine'],
  estimates: (pu: GeoPoint, d: GeoPoint) => ['estimates', pu, d],
  profile: () => ['profile'],
};
```

### 5.3 Invalidation map

| Mutation | Invalidates | Optimistic |
|---|---|---|
| createReservation | myReservations, availability(branch,date,guests), restaurant(id) | no (server-authoritative lock) |
| cancelReservation | myReservations, availability | yes — flip status, rollback on error |
| holdTickets / checkoutTickets | myTickets, event(id) | no |
| updateProfile / savePreferences | profile, me | yes |
| selectRidePartner | none (analytics only) | n/a |

### 5.4 Zustand slices

- `auth-store`: `{ user, accessToken?, hydrated }` — refresh token never lives here (SecureStore only); actions signIn/signOut/updateUser.
- `settings-store` (MMKV or AsyncStorage): theme override, language, onboardingSeen.

---

## 6. Screen specifications

Format: **Purpose · Data · UI · States · Edge cases**. Every list screen ships loading skeleton, empty state and error-retry as part of its task — not "polish later".

**FE-2 · Screen 1 — Welcome carousel**: 3 slides (Reserve tables / Tickets & events / Rides in one tap); Skip + dots; sets `onboardingSeen`.

**FE-2 · Screen 2 — Sign in**: email-or-phone single identifier field (mirrors LoginSchema OR logic) + password; show/hide; inline error on `INVALID_CREDENTIALS`; link to sign-up; honors `redirect` param.

**FE-2 · Screen 3 — Sign up**: email XOR phone segmented input, password with live rules (min 8), optional country picker; on success land on Home (BE-0.5 envelope gives user object immediately).

**FE-3 · Screen 4 — Home tab**: greeting header; quick-action tiles (Book a table / Events / Ride); "Nearby restaurants" horizontal cards (lat/lng if permission granted, else alphabetical); "Upcoming events" preview (3 items); pull-to-refresh invalidates all visible queries.

**FE-3 · Screen 5 — Explore (Reserve tab)**: search field debounced 350ms; category chips; toggle list ⇄ map (react-native-maps markers); `openNow` switch; infinite scroll pages of qk.restaurants.

**FE-3 · Screen 6 — Restaurant detail**: hero cover; verified badge; today-hours highlight; branch selector chips (distanceKm when geo available); menu preview grouped by category (collapsed sections); sticky bottom CTA "Reserve a table" (disabled with reason when WALK_IN_ONLY or no config).

**FE-3 · Screen 7 — Booking flow**: step 1 date strip (next 14 days) + GuestStepper; step 2 SlotGrid from availability.slots — unavailable slots struck-through; REQUEST_BASED shows "Request pending approval" copy instead of instant-confirm; step 3 review: date/time/guests/specialRequests(≤500 chars)/cancellationPolicyText; submit → success modal with big `reservationCode` (FR-XXXXXXXX), add-to-calendar, link to My reservations.
Edge: SLOT_FULL mid-flow → toast + auto-refetch availability; GUESTS_EXCEED_MAX clamps stepper to maxGuestPerTable surfaced by API.

**FE-3 · Screen 8 — My reservations**: segmented Upcoming/Past; card = business name, branch, date/time, guests, StatusPill; Cancel → sheet shows cancellationPolicyText → confirm mutation (optimistic). PENDING rows show awaiting-confirmation indicator.

**FE-4 · Screen 9 — Events list**: category chips + date filter; card shows cover, date block, venue, lowest-price-from; infinite pagination.

**FE-4 · Screen 10 — Event detail**: hero, description, venue row (opens maps app), organizer name (not email — BE-3.5), tier cards price-asc with remaining badge; low-stock state at remaining ≤10% of total ("Only 6 left"); sales-window guard disables CTA outside salesStart/SalesEnd.

**FE-4 · Screen 11 — Checkout**: quantity stepper (hold delta re-used via BE-3.2 idempotent hold); first hold starts **CountdownRing 10:00** keyed by holdToken; total row; CTA "Confirm purchase" (pre-payments era: free confirm; FE-8 swaps in Stripe sheet reading `paymentRequired`). HOLD_EXPIRED response → recovery modal: "Your hold expired — seats released" with Restart / Back actions.

**FE-4 · Screen 12 — Ticket wallet**: Upcoming/Past tabs; card = cover thumb, title, date, qty × tier; detail opens QRCodeView fullscreen (hash rendered locally — works offline), brightness boost while visible, share button.

**FE-5 · Screen 13 — Rides**: two MapPinPicker rows (current-location default for pickup with rationale prompt); Swap FAB; "Find rides" → estimates list cheapest-first with provider logo, price, ETA, Badge chip (Fastest/Best Value); tapping calls `/rides/select` then `/rides/dispatch-link` → Linking.openURL(deepLink); provider app missing → BottomSheet offers webFallback URL.

**FE-2 · Screen 14 — Profile hub**: avatar initials circle, name/identifier, role chip; rows: Edit profile, Preferences, Notifications (post-M5 placeholder), Settings.

**FE-2 · Screen 15 — Edit profile**: fullName, phone (read-only for phone accounts), country; PATCH optimistic.

**FE-2 · Screen 16 — Preferences**: dietary restrictions chips (Vegan/Halal/Kosher/Keto/Diabetic-friendly), allergies chips (Peanuts/Dairy/Gluten/Seafood/Soy/Eggs), default location text — straight from shared unions; saved via POST /users/preferences.

**FE-2 · Screen 17 — Settings**: language picker (en scaffolded; Q3 decides depth), theme (System/Light/Dark), About, Privacy & Terms (web views of existing `/privacy`, `/terms`), Sign out (server revokes refresh token + clears SecureStore).

---

## 7. Cross-cutting behavior contracts

### 7.1 API error code → UI treatment

| Code | Treatment |
|---|---|
| `INVALID_CREDENTIALS` | inline form error |
| `RATE_LIMITED` | toast "Too many attempts — try again in a minute" |
| `SLOT_FULL` | toast + refetch availability |
| `HOLD_EXPIRED` | checkout recovery modal (Screen 11) |
| `INSUFFICIENT_STOCK` | event detail refresh + toast with remaining count |
| `ALREADY_CANCELLED` | silent refetch (state already correct) |
| network/offline | global offline banner + retry affordance |

### 7.2 Deep links (`foodride://`)

`/restaurant/:id` · `/event/:id` · `/tickets/:purchaseId` · `/reservations/:id` — identical to router paths; universal links post-M5.

### 7.3 Push tap routing (FE-7)

| data.type | Navigate to |
|---|---|
| `reservation.confirmed` / `.rejected` | `/reservations/:id` |
| `ticket.purchased` | `/tickets/:purchaseId` |
| `hold.expiring` | `/event/:id/checkout` (restore hold state) |
| `event.reminder` | `/event/:id` |

### 7.4 Permissions UX (copy required at submission time)

- Location: "Used to show restaurants and rides near you." — requested lazily on Explore map / Rides, never at launch.
- Camera: v1 renders QR, doesn't scan — camera permission deferred until scanning ships.
- Notifications: pre-permission primer after first successful booking.

### 7.5 i18n & a11y

- All user-facing strings through `t()` from day one (`src/i18n/en.json`); no hardcoded literals in features.
- Accessibility pass per screen (FE-6): 44pt touch targets, labels on icon-only controls, contrast ≥ 4.5:1 (gold on ivory is decorative-only, never body text), dynamic type via `allowFontScaling`.

## 8. Performance budgets

| Metric | Budget | Enforced by |
|---|---|---|
| Cold start → interactive (mid-range Android) | < 2.5s | startup trace each milestone |
| List scroll | 60fps, no blank cells | FlashList for long lists, expo-image placeholders |
| Estimate round-trip perceived | < 1s | instant skeleton + Redis-cached API (45s TTL) |
| JS engine | Hermes ON (SDK 53 default) | release build check |

## 9. Mobile testing plan

| Layer | Tool | Scope |
|---|---|---|
| Unit | Jest | lib/ (dates, money, errors), stores, api client refresh-queue (mocked adapter) |
| Component | React Native Testing Library | ui primitives + critical flows (SlotGrid selection, CountdownRing expiry callback) |
| E2E | Maestro (QA-1) | auth.yaml, book-table.yaml, buy-ticket.yaml incl. force-expired hold path, ride-dispatch.yaml — nightly on Android emulator against seeded backend |