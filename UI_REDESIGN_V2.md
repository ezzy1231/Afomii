# FoodRide / UrbanExplore — UI Redesign v2 Blueprint

> Evolves `UI_PLAN.md` (mockup-driven) into a competitor-informed design direction.
> Reference models: **Resy/OpenTable** (dining), **Eventbrite/DICE** (events), **Uber/Bolt** (rides), **Yelp/Google Maps** (discovery).

---

## 1. What the proven players teach us (pattern synthesis)

| Source | Pattern we adopt |
| --- | --- |
| OpenTable / Resy | One **unified search cluster** (what + where + when + party size); availability shown as tappable slot pills; photo-forward listings; strong trust signals (rating ★ count, verified, price band) |
| Eventbrite | **Date-block badges** on every event card; category-led browsing; sticky mobile ticket CTA; tier rows with quantity steppers and live totals; "From {price}" on cards |
| DICE | Immersive full-bleed imagery for events; dark, art-directed featured cards; simple save (♥) affordance everywhere |
| Uber / Bolt | Map-first ride flow with progressive bottom sheets; ride options as a radio list (icon · ETA · price · badge like *Fastest*); one thumb, two taps to dispatch; deep-link out to providers |
| Yelp / Maps | Filters as chips + bottom sheet on mobile / sidebar on desktop; list–map split on desktop (later phase when geo data lands) |

## 2. Design direction: "Warm editorial premium"

The brand stays navy/gold (premium hospitality), but surfaces split clearly:

- **Consumer surfaces → warm, light, photo-first.** Ivory canvas, large imagery, generous whitespace, serif display headlines, gold reserved for primary actions and highlights. Feel: Resy's warmth, not a SaaS dashboard.
- **Partner/admin surfaces → deep-navy premium console.** Data-dense, tabular numerals, gold accents on KPIs. Already the mockup direction; keep.
- **Events get art-directed treatment** (DICE): full-bleed imagery, big date blocks, poster-like hierarchy.
- **Rides stay utilitarian-calm** (Bolt): map/context card, radio option list, single CTA pair.

### Non-negotiables
1. Mobile-first layouts; thumb-zone CTAs (sticky bottom bars on detail pages).
2. Touch targets ≥44px; `active:scale` press feedback; reduced-motion respected.
3. Zero hardcoded hex outside token files; light+dark both correct.
4. ETB currency everywhere (never `$`) — local trust matters more than polish.
5. Every list/card has loading skeleton, empty, and error states.

## 3. Token & utility upgrades (`globals.css`, additive)

New utilities shared across pages:
- `.snap-row` — horizontal scroll-snap carousel row with peek + hidden scrollbar.
- `.chip` / `.chip-active` — filter/category chips (pill, border, gold active state).
- `.date-badge` — Eventbrite-style month/day block.
- `.price-pill` — "From ETB X" pill with tabular numerals.
- `.trust-pill` — small verified/open-now pill.
- `.hero-warm` — refined consumer hero gradient (ivory-compatible, less "radial SaaS glow").

## 4. Component changes

| Component | Change |
| --- | --- |
| `ListingCardLarge` | Split variants: restaurants (rating pill, open-until line, save ♥) vs events (**DateBadge** overlay, venue line, **price-pill**, poster crop `aspect-[4/3]`) |
| `ListingCard` (compact row) | Keep, add save toggle target + price pill for events |
| `CategoryRow` *(new)* | Icon chip row (Restaurants, Events, Cafés, Bars, Rides) — horizontal snap, links to catalogues/filters |
| `SectionHeader` | Keep; standardize eyebrow usage |
| `Navbar` / `MobileNavigation` | Keep structure; tighten glass pill + active states (done in v1) |
| `StickyActionBar` | Use on restaurant/event detail mobile (dual CTA: secondary navy "Go by Ride" + primary gold "Book") |
| `TierRow` | Already matches Eventbrite pattern; keep |
| Home search | Wrap `HomeSearch` in a unified cluster bar (search + quick date chips + party size visual) — full behavior lands with availability APIs |

## 5. Page specs (consumer core)

### Home `/`
1. Warm hero: serif headline, subline, unified search cluster; soft gold wash instead of heavy radial navy.
2. `CategoryRow`.
3. "Trending Restaurants" — snap carousel on mobile (peek next card), 3-col grid desktop; cards use restaurant variant.
4. "This Week's Events" — featured poster card (full-bleed, date badge, From ETB, Book now) + compact dated rows.
5. Food + Ride promo banner (navy, gold CTA) — keeps the cross-sell loop unique to this platform.
6. Partner CTA band ("List your business").
7. Trust footer strip (verified partners · real-time availability · secure bookings) once claims are true.

### Catalogues `/restaurants` `/events` — chips + FilterSheet + grid/carousel hybrid; explicit sold-out/unpublished states. *(next slice)*
### Detail pages — full-bleed hero + floating info card + StickyActionBar dual CTA. *(next slice)*
### Ride — context card, option radio list, trip summary, dual dispatch CTAs. *(next slice)*
### Dashboards — unchanged direction (navy console, MetricCard/StatusPill/TierRow). *(later slice)*

## 6. Rollout slices

| Slice | Contents | Status |
| --- | --- | --- |
| A | Blueprint + token utilities + card/date-badge/price components + Home rebuild | **this pass** |
| B | Catalogues restyle (chips, FilterSheet polish, empty states) | next |
| C | Restaurant + Event detail pages (hero, floating card, StickyActionBar) | then |
| D | Ride page restyle | then |
| E | Auth flows + Settings ticket stubs | then |
| F | Dashboards polish pass | then |
| G | Micro-interactions audit (skeletons everywhere, staggered reveals, Lighthouse mobile ≥90, 320px sweep) | last |

Definition of Done per screen: matches spec at 390px & 1280px · zero raw hex · both themes correct · loading/empty/error present · touch targets ≥44px · build clean.

---

## Appendix — Research findings & concrete specs for Slices D–F
*(sources: [Bolt iOS teardown](https://gummble.com/showcase/bolt-ios/), [Uber-style map+bottom-sheet pattern](https://vp0.com/blogs/uber-clone-app-ui-kit-free-download), [shadcn.io role-selection block](https://www.shadcn.io/blocks/onboarding-role-selection), [progress-step patterns](https://designmodo.com/progress-step-ui/) / [stepper examples](https://www.eleken.co/blog-posts/stepper-ui-examples), [DICE UX case study](https://medium.com/@hannah.2carroll/dice-a-ux-ui-case-study-e8752814aa6), [dark dashboard contrast rules](https://adminlte.io/blog/dark-dashboard-templates/))*

### Slice D — Ride page (Bolt teaches: transparency is differentiation)
1. **Upfront-fare framing**: headline the estimate card "Fare upfront · ETB" — never "approximate"; add a one-line trust note ("Meter rate rules, no surge").
2. **Provider comparison stays side-by-side**: option rows = radio list (provider icon · tier name · ETA min · ETB price · badge Fastest/Best Value). Never paginate options into separate screens.
3. **Context card first**: arriving from `/restaurants/[id]` or `/events/[id]?to=…` shows a "Getting to {venue}" header card with a Change destination affordance above pickup/dropoff inputs.
4. **Favorite locations** (Home / Work / recent chips) once authed users have history — one-tap fill, cuts the #1 friction.
5. Keep manual-distance calculator visually equal to maps mode (maps optional enhancement, never a blocker).
6. Bottom summary bar: time · distance · passengers · dual CTA (secondary "Navigate", primary gold "Open {Provider}") using existing dispatch deep links.

### Slice E — Auth & onboarding (role cards + honest wizards)
1. Role picker = **single-select cards**: icon tile + title + one-line description; selected state = gold ring (`ring-2`) + check; Continue disabled until chosen. Three cards: Consumer / Restaurant partner / Event organizer.
2. Signup wizards get a labeled **progress stepper** (1 Account → 2 Details → 3 Preferences) — steps clickable back, never forward-jumping.
3. Dietary/allergy step uses chip multi-select (vegan, fasting, halal, allergies…) not free text; selections persist to `profiles.dietary_preferences`/`allergies`.
4. After signup: land users where their role lives (consumer → home w/ greeting; partners → dashboard empty-state with "Create your first listing" CTA).
5. Ticket success state → DICE-style **ticket stub wallet card**: navy card, perforated edge, QR placeholder, "Add to photos" hint.

### Slice F — Partner dashboards (dark console rules)
1. Contrast discipline on navy: body text ≥ ivory/85, muted ≥ ivory/60; gold reserved for KPIs, active nav, primary buttons — never long body text.
2. Overview = 4 MetricCards (tabular numerals, trend arrows ▲▼ with success/danger) + "Recent reservations/orders" list with StatusPills.
3. Reservations hub (OpenTable Guest Center model): Today default view, timeline/slot grouping, quick actions Confirm/Reject inline — no drill-down needed for common ops.
4. Empty states double as onboarding: each empty panel carries its own "Create first X" button.
5. Tables: sticky header, row height ≥56px mobile, horizontal scroll only past 3 columns.

### Slice G polish reminders
Staggered fade-in-up on card grids (≤12 items), skeleton shimmer already tokenized, `prefers-reduced-motion` respected globally, Lighthouse mobile ≥90 target, 320px sweep.
