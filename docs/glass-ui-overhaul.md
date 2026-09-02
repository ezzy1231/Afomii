# UrbanExplore — Glass UI Overhaul

## Before → After summary

The app moved from **"Neo-Local Bold"** (warm paper backgrounds, 1.5px ink
borders, hard offset shadows like `shadow-[3px_3px_0_0_rgb(24_22_18)]`, four
competing accent colors — ember/amber/moss/gold — and Bricolage Grotesque +
Space Grotesk) to a **restrained glassmorphism system**: one near-white /
near-black neutral base, a single ember accent, frosted panels floating over
a soft ambient glow, soft layered shadows, one type family (Space Grotesk),
and 150–300ms ease-out motion.

### Design tokens (`app/globals.css`)

| Token | Light | Dark |
| --- | --- | --- |
| `--bg-primary-rgb` | `248 248 250` | `15 15 18` |
| `--glass-bg` | `rgb(255 255 255 / 0.62)` | `rgb(30 30 36 / 0.55)` |
| `--glass-border` | `rgb(23 23 26 / 0.08)` | `rgb(255 255 255 / 0.10)` |
| `--ember-rgb` (accent) | `235 92 30` | `255 122 61` |
| Ambient glow (`body::before`) | ember + indigo radial washes | same, dimmed |

Utility classes: `.glass`, `.glass-strong`, `.glass-subtle`, `.glass-hover`,
`.glass-backdrop`, `.nav-blur`. Legacy classes (`btn-primary`, `card-elevated`,
`chip`, `eyebrow`, `date-badge`, `price-pill`, `sticker`, `input-premium`,
`badge-gold`, `hero-warm`, `snap-row`, `dot-grid`, `trust-pill`) were all
**re-styled in place** to the glass language, so every page that referenced
them shifted coherently without per-page edits.

Motion: `fade-in-up` (280ms), `pop-in` (200ms), `skeleton-shimmer`;
`cubic-bezier(0.22, 1, 0.36, 1)` ease-out + `cubic-bezier(0.16, 1, 0.3, 1)`
glide only; global `prefers-reduced-motion` kill-switch.

### Tailwind config (`tailwind.config.ts`)

- `ember` accent (`DEFAULT` / `deep` / `soft`); `amber`, `gold`, `moss` now
  alias to the same RGB vars so untouched classes stay consistent.
- `navy` / `ink` → neutral greys derived from `--text-primary-rgb`; `ivory`
  → `#F8F8FA`.
- `font-display` / `font-serif` / `font-sans` all resolve to Space Grotesk —
  one family, weight-driven hierarchy.
- `shadow-hard` / `shadow-hard-lg` (legacy names) now render soft layered
  shadows; new `shadow-soft` / `shadow-card` / `shadow-elevate` /
  `shadow-glass` / `shadow-glass-strong` scale.

### Pages touched

**Reference surfaces (fully reworked):**
- Navbar (desktop + mobile dock + notifications) — glass sticky header,
  ember gradient logo tile, "My Plans" label.
- Home (`/`) — eyebrow pill, glass search bar, glass photo-collage cards,
  ember cross-sell card, partner CTA panel, glass category chips.
- Restaurants (`/restaurants`) + Events (`/events`) listings — shared
  `ExploreCatalogue`: glass search toggle, filter sheet, featured hero card,
  staggered glass listing grid with hover lift.

**Detail pages:**
- `/restaurants/[id]` — glass identity card over hero, glass quick-action
  tiles, branch picker pills, photo strip, ember ride/reserve CTAs.
- `/events/[id]` — glass info/organizer/location cards, glass ticket panel
  with ember gradient book button, reworked confirmation screen.
- `/organizers/[id]` — glass identity + featured event cards, ember accent
  system replacing gold, date ribbon tiles.

**Ride booking (`/ride`):** glass route card + "why book" panel, glass trip
summary + map frame, glass ride-selector list with ember active state,
frosted sticky bottom bar with ember gradient Book button, restyled map
markers (white ring + soft shadow).

**Plans ("My Plans", `/plans`):** glass tab bar with ember gradient active
tab, glass plan cards with ember gradient thumbnails, ember "Book a Ride"
button.

**Dashboards:**
- `components/dashboard/sidebar.tsx` — glass sidebar with ember active
  states; dark console palette (`#07192B` / `#0B1D31` / `#4d5f7d` /
  `#C2A878` / `#DFC391` / `#7587A7` / `#B5C7EA`…) fully replaced with
  theme-aware tokens — dashboards now work in **light and dark** instead of
  hardcoded navy.
- `console.tsx` primitives — `CONSOLE_CARD` is now `glass rounded-2xl`;
  segmented controls/range links render as glass pills with ember gradient
  active state (smooth tab transitions); sparkline strokes ember.
- All `app/dashboard/**` pages (admin: overview, users, businesses,
  organizers, events, reservations, audit, metrics, settings; organizer:
  dashboard, events, calendar, tickets, analytics; restaurant: overview,
  listings, reservations, branches, menu, analytics) swept from hardcoded
  console hexes to tokens; local `CONSOLE_CARD` duplicates unified.
- Dashboard layouts no longer paint an opaque `bg-app-bg` — glass panels
  float over the ambient glow.

**Auth & account:**
- `/auth/signin`, `/auth/signup/*` (user/business/organizer), `/auth/role`,
  `/auth/forgot-password` — gold/serif styling normalized to ember/glass
  (inherits from remapped tokens; SignupStepper/CategoryPicker/
  PayoutDetailsFields converted).
- `/settings` — ticket stubs restyled (ink glass cards, ember top rails),
  dashed empty-states normalized.
- `/vision`, `/about`, `/privacy`, `/terms`, `/not-found`, `/error`,
  `/loading` — token sweep.

**System-design showcase (`/system-design`):** rewritten to document the NEW
glass system (palette, typography, UI elements, usage rules) — it previously
showcased the old navy/gold artboard.

### Also fixed along the way

- Repaired pre-existing UTF-8 mojibake (`â€”`, `â€¦`, `Â·`, `â€º`, `â€¢`,
  `â†’`, `â€“`) across 9 files — em-dashes, ellipses, and middle dots now
  render correctly.
- Removed dead '/settings' Profile link from NavLinks (account lives in the
  navbar avatar / mobile Account tab).
- Typecheck (`tsc --noEmit`) and production `next build` both pass — all 44
  routes compile.

### What was deliberately NOT changed

- Component APIs (props, exports, tone names like `StickyActionBar`'s
  "gold"/"navy") — kept for compatibility; both tones now render the ember
  gradient.
- Business logic, data fetching, Supabase queries, route structure.
- The Google brand-color SVG in the sign-in page (brand mark, not UI).
