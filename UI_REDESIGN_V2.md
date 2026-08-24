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
