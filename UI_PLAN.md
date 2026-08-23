# UrbanExplore (FoodRide) UI Plan

Source of truth: `system design/` mockups (22 refs) + handwritten specs.
Goal: professional, seamless, modern UI that works flawlessly on mobile and desktop.

---

## 0. Core Problem Today

- Brand tokens exist in `tailwind.config.ts` (navy/gold/ivory, `app-*` CSS vars) but **most components hardcode hex colors** (`#071a2e`, `#d7b778`, `#f7f0e8`…), so light/dark themes and consistency break.
- Pages were built desktop-first with ad-hoc styling; mobile bottom nav exists but screens don't match the mockup layouts.
- No shared primitives for the mockup's signature patterns (hero cards, metric cards, tier rows, sticky dual CTA, filter chips, section headers with "See all").

## 1. Design Foundations (fix first — everything inherits from this)

### 1.1 Single token layer
- Extend `globals.css` CSS vars so **every** color comes from a var: `--bg-primary`, `--bg-card`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--border`, `--gold`, `--gold-soft`, `--navy`, `--success`, `--danger`.
- Light theme = Ivory `#F8F5F0` bg, navy text (consumer mockups, photo 15/16).
- Dark theme = Deep navy `#0B1F3A`-family bg, ivory text, gold accents (dashboard mockups, photo 05/07/10).
- **Rule: no raw hex in components.** Replace all `#071a2e`/`#d7b778`/`#f5efe9` style classes with `app-*` / `gold` / `navy` tokens. Grep-audit at the end.

### 1.2 Typography
- Playfair Display (serif) for headings, page titles, prices in hero contexts — already wired via `font-serif`.
- Inter for everything else. Sizes: `text-xs` meta, `text-sm` body-secondary, `text-base` body, `text-lg/xl` card titles, `text-2xl→4xl` page titles.
- Numeric data (metrics, prices): `tabular-nums` + Inter semibold.

### 1.3 Shape, elevation, motion
- Radius scale already set (12–28px). Cards: `rounded-2xl` + `shadow-card` (light) / `dark-card` (dark).
- One reusable "glass panel" style for navbar/overlays.
- Motion: 150–200ms ease-out on hover/press; `animate-pop-in` for confirmations; skeleton shimmer for loading; respect `prefers-reduced-motion`.
- Touch targets ≥ 44px on mobile; `active:scale-[0.98]` press feedback.

### 1.4 Responsive strategy ("seamless on mobile & PC")
- **Mobile-first builds**, enhance at `sm/md/lg`.
- Navigation: `MobileNavigation` (bottom 5-tab: Home, Restaurants, Events, Ride, Profile) < `lg`; `Navbar` desktop ≥ `lg`. Both already exist — restyle to mockup (navy pill bar, gold active).
- Dashboards: `Sidebar` ≥ `lg`; on mobile collapse into a top horizontal tab strip + bottom nav entry point (no hamburger dead-ends).
- Sticky bottom action bars on detail pages (dual CTA pattern from photo 08/10) — mobile only; inline CTAs on desktop.
- Grids: 1-col mobile → 2-col `sm` → 3–4-col `lg`. Carousels: horizontal scroll-snap with peek on mobile, grid on desktop.
- Forms: single column mobile, 2-col `md+`; step wizards keep progress indicator on top.
- Safe areas: `env(safe-area-inset-bottom)` padding for bottom nav/sticky bars.

## 2. Shared Component System (build once, reuse everywhere)

Create in `components/ui/` + `components/patterns/`:

| Component | Mockup ref | Notes |
|---|---|---|
| `SectionHeader` (title + "See all →") | photo 16 | every home/catalogue section |
| `ListingCard` (image, rating, meta, badges, heart) | photo 16 | restaurants + events variants |
| `CategoryChips` (icon + label, scrollable) | photo 16 | cuisines, event types |
| `PromoBanner` (Food + Ride combo) | photo 16 | gold-bordered navy banner |
| `MetricCard` (value, trend, icon) | photo 05/10 | exists — restyle to dashboard look |
| `StatusPill` (Published/Draft/Pending/Confirmed…) | photo 05/10 | unify existing Badge variants |
| `TierRow` (name, price, qty stepper, left counter) | photo 07 | ticket tiers + reservation guests |
| `StickyActionBar` (dual CTA: primary gold + secondary outline) | photo 08/10 | detail pages |
| `FilterSheet` (mobile bottom sheet / desktop sidebar) | photo 24 | event type, kids, tourists, budget |
| `EmptyState`, `SkeletonCard`, `ErrorRetry` | — | consistent loading/empty/error |
| `Avatar`, `VerifiedBadge`, `PremiumBadge` | photo 08/22 | partner identity |

## 3. Screen-by-Screen Plan

### 3.1 Home `/` (photo 16 left)
- Greeting header ("Good evening, {name} 👋") when signed in; search bar with filter icon.
- Category icon row (Restaurants, Events, Cafés, Bars, More).
- "Popular Restaurants" horizontal snap carousel → `ListingCard` mini.
- `PromoBanner` Food + Ride combo → links `/ride`.
- "Nearby Restaurants" list rows; "Upcoming Events" date-badge rows.
- Desktop: 12-col grid — hero + search top, carousels become 3-col rows.

### 3.2 Catalogues `/restaurants`, `/events` (photo 16 middle + photo 24)
- Restyle `ExploreCatalogue`: sticky search + `CategoryChips`, `ListingCard` grid, `FilterSheet` (event type / kids / tourists / budget per photo 24).
- Featured event hero card (big image, date badge, "From ETB X", Book now).
- Explicit states: sold out, unpublished, cancelled (Phase 7 alignment).

### 3.3 Restaurant detail `/restaurants/[id]` (photo 08 — strongest mockup)
- Full-bleed hero image, floating logo card, name + rating + PREMIUM badge, address + Directions.
- Branches strip (distance per branch) when >1 branch.
- Quick-action grid: Menu · Reserve · Follow · Save · Share.
- Real-time availability strip ("Available now · Next slot 7:30 PM") → links reservation form.
- Photos gallery, About, Highlights (icons), Cuisine chips.
- Sticky dual CTA mobile: "Go by Ride" (navy) + "Book a Table" (gold); inline on desktop.

### 3.4 Event detail `/events/[id]` (photo 07 event panel)
- Hero, hosted-by organizer chip (links organizer profile), date/time/venue block.
- `TierRow` list with live "X left" and qty steppers (already partially built in WIP).
- "Book Ticket" gold CTA + secondary "GO / Book Ride" pair (mockup pattern).
- Success state: ticket code card (already built) — restyle to gold-bordered navy ticket with perforation styling.

### 3.5 Ride `/ride` (photo 06 — "Go & Book Ride")
- Header with Secure pill; context card (restaurant booking context when arriving from a detail page).
- Pickup/destination card (auto-detected pickup, editable destination).
- Route map panel (optional Maps; graceful fallback to distance card — keep manual ETB calculator primary).
- "Choose a ride" list: provider logo, tier, ETA, price, badge (Fastest/Best Price/Local Choice), radio select.
- Trip summary bar (time · distance · passengers · pay in app) + dual bottom action: "Go / Navigate" + "Book Ride".

### 3.6 Auth flows (photo 03, 02, handwritten notes)
- Role picker: 3 large cards with tinted icons (User pink, Food orange, Events purple per mockup) — restyle `/auth/role`.
- Signup wizards: keep steps; add category radio-list screens (business categories, organizer types) exactly like photo 02.
- User signup: add full dietary restrictions set (vegan, pescatarian, keto, halal/orthodox fasting, etc.) and allergies checklist from handwritten notes; birth day with EC/GC calendar toggle, gender, country.
- Inputs: floating labels optional; consistent `Input`/`Select` with gold focus ring; inline validation.

### 3.7 Restaurant dashboard (photo 10 bottom row)
- Dark navy dashboard theme (premium feel), sidebar ≥ lg / tab strip mobile.
- Overview: 4 `MetricCard`s (reservations, views, followers, revenue ETB) with trend arrows + Recent Reservations list with `StatusPill`s.
- Reservations: Day/Week/Month toggle + slot cards (time, table, guests, status) — upgrade existing `ReservationCalendarGrid`.
- Menu manager: category tabs (photo 10: Appetizers…Drinks) + item rows with photo, price, availability toggle, "+ Add Item".
- Booking config panel: mode toggles (Walk-in / Time slot / Request), capacity, prepayment rules, cancellation policy (handwritten notes 11–12).
- Analytics: profile views, bookings, conversion, revenue + line chart (recharts or lightweight SVG sparkline).

### 3.8 Organizer dashboard (photo 05)
- Same shell as 3.7. Overview: events, followers, views, tickets sold, attendance rate.
- Calendar month grid with event chips (Published/Draft/Completed legend) — tap date → create event.
- Create Event: 5-step wizard (Basic → Venue → Date/Time → Ticket tiers → Publish) with progress bar; ticket tier step uses `TierRow` editor (free / GA / Early bird / VIP / VVIP per notes).
- Ticket management: tier cards with sold/quantity progress + edit/duplicate.
- Published events: tabs Upcoming/Live/Past/Drafts with thumbnail rows, Edit/Publish buttons.

### 3.9 Organizer public profile `/organizers/[id]` (photo 22/23) — NEW page
- Logo, verified badge, bio, location; stats row (Events · Followers · Rating); Follow button.
- Tabs: About / Events / Calendar / Reviews. Calendar month view with event dots.
- Bottom nav on mobile stays (mockup shows 5-tab).

### 3.10 Settings `/settings`
- Sections as cards (profile, dietary/allergies chips editor, reservations, tickets, session). Ticket rows get ticket-stub styling with QR code display.

### 3.11 Admin `/dashboard/admin` (Phase 10 alignment)
- Same dashboard shell; platform metrics, management tables (users, businesses, events, offers) with search + `StatusPill` + row actions; moderation audit list.

## 4. Execution Order

**Slice 1 — Foundations (no visual regressions possible)**
1. Token audit: extend CSS vars in `globals.css`; map all hardcoded hex → tokens across ~20 files (mechanical, grep-driven).
2. Restyle primitives: `Button`, `Input`, `Select`, `Card`, `Badge`, `MetricCard` to mockup spec.
3. Build pattern components (Section 2) + `SkeletonCard`/`EmptyState`.

**Slice 2 — Consumer core (mobile-first)**
4. `MobileNavigation` + `Navbar` restyle (navy pill, gold active, safe-area).
5. Home page rebuild (3.1).
6. Catalogues + FilterSheet (3.2).
7. Restaurant detail (3.3) — the flagship mockup.
8. Event detail polish (3.4) + ticket stub success.
9. Ride page rebuild (3.5).

**Slice 3 — Auth & settings**
10. Role picker + signup wizards restyle + category/dietary screens (3.6).
11. Settings cards + ticket stubs (3.10).

**Slice 4 — Dashboards (dark premium theme)**
12. Dashboard shell: sidebar/tab-strip responsive pattern.
13. Restaurant dashboard suite (3.7).
14. Organizer dashboard suite (3.8) incl. create-event wizard.
15. Admin tables (3.11).

**Slice 5 — Extras**
16. Organizer public profile (3.9).
17. Micro-interactions pass: skeletons everywhere, page transitions, reduced-motion audit.
18. Final QA: token grep audit, Lighthouse mobile pass, 320px–1440px sweep, touch-target audit.

## 5. Definition of Done (per screen)
- Matches mockup layout at 390px and 1280px.
- Zero hardcoded hex outside token files.
- Light + dark themes both correct.
- Loading/empty/error states present.
- Touch targets ≥44px; keyboard reachable on desktop.
- `npm run build` clean.
