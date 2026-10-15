# UI port — "Evening Ledger" (Navy)

Ported the Replit export's UI structure into `apps/web`, re-themed from its
highland-green/berbere accent to **matte navy**. Scope: **public site + auth**.
Dashboards were deliberately left alone.

Source of the design: `ReplitExport-ediludensemo1/UrbanExplore-Addis-Ababa/artifacts/urbanexplore`
(referred to below as "the export").

---

## 1. Why the export was portable at all

The export is a Vite SPA, but `vite.config.ts` aliases `next/link`,
`next/image`, `next/navigation`, `next/cache`, `next/headers` and `next/dynamic`
onto local shims in `src/platform/`. The application code therefore still
**imports real Next APIs** — only `App.tsx` (the Vite entry) touches the shims.
Verified: a single file in the whole export references `@/platform`.

So the port is a file copy, not a rewrite. `.migration-backup/apps/web` in the
export is byte-identical to this repo at the time of import, which is how we
know exactly which files the redesign touched and that nothing of ours was
overwritten by taking them.

---

## 2. The palette

Direction: **keep the export's structure** (solid matte surfaces, no glass, no
glow, editorial hierarchy, Bricolage Grotesque display type) — **change the
accent from highland green to matte navy.**

| Token | Export (green) | Here (navy) |
|---|---|---|
| `--ember-rgb` (accent) | `22 84 61` | **`28 58 100`** |
| `--ember-deep-rgb` | `14 62 45` | `18 41 74` |
| `--ember-soft-rgb` | `222 236 227` | `226 234 246` |
| `--text-primary-rgb` | `20 30 25` (green-black) | `19 27 42` (blue-black) |
| `--bg-primary-rgb` | `250 248 243` | `250 248 243` (kept — warm paper) |
| `--gold-rgb` (signal) | `200 78 38` (berbere) | `200 78 38` (kept) |
| `--footer-warm` | `rgb(15 44 33)` | `rgb(14 24 41)` |
| dark accent | `126 201 160` (mint) | `137 178 233` (matte light blue) |

**The signal colour is still berbere** (the warm red-orange on date badges,
live dots, saved hearts, and the tick before every eyebrow). You asked for the
green to go, not the warm accent, and navy + berbere is a deliberate
warm/cool pairing. If you want it brass/amber instead, it is three lines in
`apps/web/app/globals.css` — `--gold-rgb`, `--gold-text-rgb`, `--gold-soft-rgb`.

**To change the blue**, edit `--ember-rgb` / `--ember-deep-rgb` /
`--ember-soft-rgb` in `:root` (light) and `[data-theme='dark']`. Everything
else — buttons, links, chips, focus rings, selection, the eyebrow tick, badges
— derives from those. Nothing else hardcodes the accent.

---

## 3. Page-by-page audit — 53 pages

Reconciliation: **5 rewritten + 18 inherited = 23 public/auth pages**, plus
**30 dashboard pages** out of scope = **53**.

### 3.1 Rewritten by the redesign — 5 routes, plus a layout and 3 global states

The table below has 9 rows, but only the first five are route pages; the rest
are a shared layout and global states that sit outside the route list.

| Route | File | Change |
|---|---|---|
| `/` | `app/page.tsx` | New hero, catalogue bands, closing CTA (full rewrite) |
| `/vision` | `app/vision/page.tsx` | Layout + copy |
| `/restaurants/[id]/menu` | `app/restaurants/[id]/menu/page.tsx` | Layout |
| `/auth/*` (all) | `app/auth/layout.tsx` | New split layout: navy photo band + form card |
| `/auth/signup/business` | `app/auth/signup/business/page.tsx` | New layout |
| `/auth/signup/organizer` | `app/auth/signup/organizer/page.tsx` | New layout |
| error boundary | `app/error.tsx` | Restyled |
| loading | `app/loading.tsx` | Restyled |
| 404 | `app/not-found.tsx` | Restyled |

Plus `app/icon.svg`, `app/globals.css`, `app/tailwind.config.ts` (foundation).

### 3.2 Inherited the new look (file untouched, styling changed) — 18 pages

These were byte-identical between the export and this repo; they inherit the
redesign entirely through the token layer and the ported shared components
(Navbar, Footer, MobileNavigation, ListingCard, patterns/*).

`/restaurants` · `/restaurants/[id]` · `/events` · `/events/[id]` ·
`/plans` · `/ride` · `/about` · `/privacy` · `/terms` · `/settings` ·
`/organizers/[id]` · `/auth/signin` · `/auth/signup/user` ·
`/auth/callback` · `/auth/forgot-password` · `/auth/no-access` ·
`/auth/role` · `/auth/suspended`

### 3.3 Out of scope for the port — 30 pages

Everything under `/dashboard/admin/*` (15), `/dashboard/organizer/*` (7) and
`/dashboard/restaurant/*` (8). The port left their markup and tokens alone;
§5 records that evidence, and §5.1 covers the later accent follow-up, which
recoloured five console files without changing any layout.

---

## 4. Endpoints — 6, all untouched

| Endpoint | Auth | Verified |
|---|---|---|
| `GET /api/health` | none | 200, `supabase.ok = true` |
| `GET /api/geo/search?q=` | none | 200 |
| `GET /api/geo/route` | none | 400 on incomplete params (validation, as before) |
| `GET /api/notifications/user` | session | 401 anonymous (as before) |
| `GET /api/places/saved` | session | 405 on GET (POST/DELETE only, as before) |
| `GET /api/plans/user` | session | 401 anonymous (as before) |

No `route.ts` was modified. No server action was modified (`lib/**` untouched).

---

## 5. How the dashboards are kept separate

Every dashboard renders inside `<ConsoleShell>`, which emits
`.shell-console`. That block re-bases the semantic tokens onto the console's own
fixed-light palette. Measured live in a browser, on a `.shell-console` subtree,
in **both** themes:

| | inside `.shell-console` | public `:root` |
|---|---|---|
| accent | `28 58 100` (brand navy) | `28 58 100` / dark `137 178 233` |
| card | `255 255 255` | `255 254 250` / dark `21 27 41` |
| font | **Space Grotesk** | Instrument Sans |
| `--radius-lg` | **18px** | 16px |
| shadow | console shadow | paper shadow |

Font and radius are pinned back explicitly, because the redesign changed the
body typeface and tightened the radius scale; without that the dashboards would
have silently drifted.

### 5.1 The console accent mirrors the brand (follow-up)

Originally the console kept its own indigo `91 63 240`, which meant the brand
colour changed the moment you signed in. That seam is now closed: the console
accent is the same navy as the public site.

One trap had to be handled. Three sidebar elements sit **on the navy sidebar**
itself (`#131A2E`), not on light cards:

- the active nav pill ([`console-shell.tsx:233`](../apps/web/components/dashboard/console-shell.tsx:233))
- the "Boost Your Event" promo card
- (the account avatar sits on a light surface, so it keeps the brand navy)

Reusing the brand navy there measured **1.51:1** against the sidebar — an
effectively invisible active state. So there is a second token,
`--console-nav-accent-rgb: 63 114 190`, used only for on-dark surfaces. It
measures **3.59:1** against the sidebar (the old indigo was 2.81:1, so this is
also an accessibility improvement) and carries white text at **4.81:1**. This
mirrors what the public design already does by lightening its accent in dark
mode rather than reusing the light-theme value.

Four hardcoded indigo/violet literals were also recoloured
(`rgb(91_63_240/…)` shadows, a `#5B3FF0` chart stroke, and two violet gradient
stops). Verified: no indigo/violet literal remains in `components/dashboard`,
`globals.css` or `tailwind.config.ts`.

---

## 6. Follow-ups and findings

**1. A catalogue holding exactly one listing rendered a hero and a blank grid.**
`ExploreCatalogue` took `featured = visibleItems[0]` and
`rest = visibleItems.slice(1)`, while `EmptyState` only renders at **zero**
items. With one restaurant that meant a hero card and then nothing — no card,
no empty state. **Fixed:** the lead card is now only promoted when something can
follow it (`visibleItems.length > 1`); a lone result renders as an ordinary grid
card. Verified against the live server: `/restaurants` and `/events` now emit
`listing-card` and no longer emit `featured-listing` or a blank region.

**2. Two smoke tests asserted on marketing copy.** `home renders hero…` pinned
the H1 to `/find a place/i`; the redesign rewrote the hero to "Dinner, a show,
and the ride there." I changed the assertion to check the structural contract
(an h1 exists, is visible, is non-empty, `main` is visible) rather than prose,
so the next reskin doesn't look like a failure.

**3. Copy and nav-label drift — fixed.** "Load More Experiences" on the
restaurants page and "Upcoming Experiences" on the events page are now
"Restaurants"/"Events"; `/plans` is "My Plans" in the desktop nav, mobile bar and
footer (was "My Plans"/"Plans"/"My plans"). The mobile bar's "Eat" became
"**Dining**", matching the page's own "Dining guide" eyebrow — "Eat" read as
delivery. Mobile labels stay shorter than desktop ones on purpose: six tabs share
a 390px bar.

**4. Contrast — one real failure fixed, one open.** Audited with
`logs/contrast-audit.mjs`, which parses the live token values:

- **Fixed:** the date-badge month was paper `#FFFAF3` on the brighter berbere
  `#C84E26` = **4.42:1**, just under the 4.5:1 AA floor for its 10px bold text.
  The badge background now uses `--gold-text-rgb` → **6.24:1** (dark mode
  8.77:1).
- **Open (pre-existing):** `--console-muted-rgb` on a white console card is
  **3.85:1**, below AA for the 11–13px secondary text it carries in the
  dashboards. Not introduced here and not part of the accent work.
  `--console-muted-rgb: 106 114 134` would reach 4.81:1.
- **Tripwire:** the berbere `signal` colour as *text* on paper is **4.33:1**.
  It is currently only used for icons, stars, hearts and dots (icons need 3:1),
  so nothing fails today — but it must not be used for text.

**5. The photography was not Ethiopian.** Reported from the landing page: the
mosaic's two photos were a **modern Western restaurant interior** and a **pub
garden full of people** — captioned "A shared Ethiopian meal served on injera"
and "City lights in the evening". Both alt texts were simply false.

A contact sheet of the whole shipped set (`logs/places-contact-sheet.png`) showed
this is not limited to those two: **none of the 18 images in
`apps/web/public/places/` depict Ethiopian food, drink or venues.** They are
generic Western stock — cafés, lattes, concerts, a DJ, a Buddha bowl, pasta, a
bar, a seaside terrace.

**Fixed on the landing page:** both slots now carry real Ethiopian food
photography, cropped to the exact aspect of the slot each fills rather than left
to `object-cover`:

| Slot | File | Subject |
|---|---|---|
| large (341×460) | `ethiopian-traditional.jpg` | traditional combination platter — injera, lentil/chickpea/vegetable stews |
| small (223×224) | `ethiopian-modern.jpg` | Ethiopian stews and greens, modern restaurant plating |

Both are **CC BY-SA 4.0** from Wikimedia Commons, credited in
`apps/web/public/places/CREDITS.md`. **CC BY-SA requires attribution wherever the
images are published** — that file satisfies the repository, but the public site
still needs a visible credit (a footer line or a `/credits` page). Not done yet.

Two loose ends, deliberately left alone:

- The other 16 stock images are still non-Ethiopian and still unattributed, and
  their provenance is unknown. Worth replacing with real Addis Ababa photography
  before launch.
- `food-2.jpg` remains on disk because `packages/supabase/seed-places.sql:42`
  references it as a cover image; deleting it would break a fresh
  `npm run supabase:apply`.

**6. The home page event rows hid their photo on phones.** Reported from the
landing page: "the event card is small and in mobile it doesn't show the
picture". Both were true, and both came from the redesign (source
`app/page.tsx:232`), which the port carried over faithfully:

```jsx
<div className="relative hidden size-20 shrink-0 overflow-hidden rounded-xl … md:block">
```

`hidden … md:block` means no photo at all below 768px, and even above it the
thumbnail was only 80px. Measured before the fix: mobile image `0x0`
(`display: none`) in a 106px row; desktop `80x80` in a 120px row.

The pre-port home page had no equivalent row — it used a three-card hero stack
plus a featured event poster — so this was a redesign consequence rather than a
porting artefact.

**Fixed** in `app/page.tsx`, over two rounds:

1. The ledger was kept, but the photo was shown at every width and enlarged —
   mobile `0x0` → `356x200` (16:9, date badge overlaid), desktop thumbnail
   `80x80` → `112x112`.
2. On review the desktop row *still* read as too small beside the restaurants
   section, so **the ledger was dropped entirely.** The events section now
   renders the same `ListingGrid` as the tables section:

   ```jsx
   <ListingGrid items={eventRows} type="events" />
   ```

   One event → the full editorial spread (large photo, details, navy "See
   tickets" CTA). Two or more → the same 2–3 column `ListingCardLarge` grid the
   restaurants use. Both components were already event-aware (`DateBadge` from
   `startsAt`, `CalendarDays` + the when line, price pill, "Get tickets"), and
   `OrganizerProfile.tsx:278` already exercises that events branch in
   production, so the multi-event path is not new code.

   The bespoke ledger markup, the local `eventDateParts()` helper and the
   `DateBadge` import it required were all removed; every remaining import in
   the file is still used.

Verified after the change: the home page renders **2 visible images on a 390px
phone** — the restaurants spread and the events spread — so neither section
hides its photo on mobile. No horizontal overflow at 390px on `/`,
`/restaurants` or `/events`.

---

## 7. Verification evidence

| Check | Result |
|---|---|
| `next build` | ✅ exit 0, 49 routes, no errors |
| Unit tests (vitest) | ✅ 69/69 |
| E2E smoke (playwright) | ✅ 15/15 |
| Page loads, light + dark | ✅ 18/18 HTTP 200 |
| Import resolution across ported files | ✅ all resolve |
| Leftover green/old-palette literals in `apps/web` | ✅ none |
| Leftover indigo/violet literals in console + tokens | ✅ none |
| Console token isolation | ✅ Space Grotesk, 18px, white cards, console shadows preserved |
| WCAG contrast audit | ✅ 2 open items, documented in §6.4 |
| Single-listing catalogue | ✅ emits `listing-card`, no blank region |
| Mobile 390px | ✅ no horizontal overflow, bottom nav renders |

### Files changed — 47, all inside `apps/web`

Exact reconciliation of `git status` (44 modified + 3 new):

| Group | Count | Files |
|---|---|---|
| `app/**` | 12 | `globals.css`, `layout.tsx`, `page.tsx`, `vision/page.tsx`, `restaurants/[id]/menu/page.tsx`, `auth/layout.tsx`, `auth/signup/business/page.tsx`, `auth/signup/organizer/page.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `icon.svg` |
| `components/**` (public) | 25 | 14 top-level public components, `reservation-form.tsx`, `patterns/*` (8), `auth/CategoryPicker.tsx`, `ui/button.tsx` |
| `components/dashboard/**` | 5 | accent follow-up only (§5.1): `console-shell.tsx`, `console-tokens.ts`, `console-event-calendar.tsx`, `console-area-chart-impl.tsx`, `partner-profile-editor.tsx` |
| `components/BrandMark.tsx` | 1 | new — extracted brand mark the new Navbar imports |
| `tailwind.config.ts` | 1 | `app-alt` / `app-subtle` / `signal`, `console.nav-accent`, display font, shadow tokens |
| `e2e/public-smoke.spec.ts` | 1 | stale copy assertions + `featured-listing` hook |
| `public/fonts/*` | 2 | new — Instrument Sans variable (latin + latin-ext) |

Of the 12 `app/**` files, **3 are the foundation** (`globals.css`,
`layout.tsx`), **5 are route pages**, **1 is the auth layout**, **3 are global
states** (error/loading/not-found) and `icon.svg` is an asset.

Scratch tooling used for the audits lives in the gitignored `logs/`
(`contrast-audit.mjs`, `console-isolation.mjs`, `ui-audit.mjs`, `shots*.mjs`).

`lib/**` was deliberately **not** taken from the export: the Vite migration had
degraded it (`import.meta.env.VITE_*`, a browser Supabase client on the server,
a catalogue that swallowed failures into an empty list). This repo's `lib/` is
already correct Next.js code and is strictly better.
