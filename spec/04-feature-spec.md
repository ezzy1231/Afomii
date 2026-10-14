# 04 — Feature Specification (from the whiteboard notes + mockups)

## Status

| Field | Value |
|---|---|
| Date | 2026-10-14 |
| Source | 5 handwritten notebook pages + 10 design mockups (FoodRide artboards, UrbanExplore artboards, colour/type/usage sheet) |
| Baseline | `c6978c5` fix: restore the public restaurant catalogue, which RLS made unreachable |
| Method | Every note line and every mockup panel traced to `apps/web/**` and `packages/supabase/migrations/**` before it was classified |
| Verified | `npx tsc --noEmit` clean · `next lint` warnings-only (all pre-existing) · `vitest` 69/69 |

**Line numbers in §1–§5 refer to the baseline commit `c6978c5`**, i.e. the state that was
inspected. §7 lists what changed.

## What this document is

The notes describe a product that is **larger than what is built**. This spec splits every
line into one of two buckets:

- **FIX** — the capability exists; the UI is wrong, lying, or has dead data behind it.
  These were fixed in the pass recorded in §7.
- **NEW** — no screen, no column, no table. Building it is net-new work with a schema
  decision attached. Not built here.

The governing rule for this pass, chosen deliberately: **a label must describe the data
behind it, and fetched data must be rendered.** Every FIX below is one of those two failures.

## Reading the mockups

Two brands appear in the source material.

| Mockup set | Identity | Relationship to this repo |
|---|---|---|
| FoodRide (navy `#0B1F3A` + gold `#C2A878`, Playfair Display + Inter) | A different product name | **Design vocabulary, not a rebrand.** The colour/type/usage sheet at the foot of that artboard is the useful artefact |
| UrbanExplore (`urbanexplore.netlify.app`, ivory + navy) | This product | **Already implemented.** These are the live consumer surfaces |

The live token system is neither: `app/globals.css` runs an ember/gold/ink glass theme over
`app-fg`/`app-card`/`app-border`/`app-ink`/`app-ember`. Adopting either mockup's palette is a
**rebrand decision**, recorded in §6 as N-19, not a fix.

---

## 1. Discovery & filtering

### Notes
> cuisine filter, location filter, price filter, golden · sort by popular / newest / time ·
> Tickets, Concerts, Parties, Theatre, Mexican, Korean, Amharb, Turkish, Chinese, Italian,
> Japanese, Indian, French, Mediterranean, Spanish, Arabica, Ethiopian, American, Thai, Tuna
> · more filters
> should be at first on the second page

### Findings

| Item | Class | Status |
|---|---|---|
| Cuisine filter | FIX | Present but from **two hardcoded arrays** — `ExploreCatalogue.tsx:32` (chips) and `:83-91` (sheet). Diverged: `Middle Eastern` sheet-only. `restaurants.cuisine` is free text (`app/dashboard/actions.ts`), so any cuisine a partner types outside these 7 literals is permanently unfilterable |
| Location filter | **NEW** | No filter group. `area_label` is fetched (`lib/catalogue.ts:96`) and rendered, never filtered |
| Price filter | **NEW** | No `price_level` column exists on `restaurants` (`0002_core_tables.sql:53-71`) |
| Sort by popular | **NEW** | No popularity signal anywhere — no views, no booking count, no score |
| Sort by newest | **NEW** | The catalogue *is* ordered `created_at desc` (`lib/catalogue.ts:98`) but the UI exposes only a rating toggle (`ExploreCatalogue.tsx:332-340`) |
| Sort by time | **NEW** | Not on `/restaurants`. Events sort soonest-first already (`:178-182`) |
| "More filters" toggle | FIX | Exists, labelled **"Filters"** (`ExploreCatalogue.tsx:353`). Label matches what it does; the notes' "More filters" is a design preference, not a defect |
| "Filters at the top of the second page" | — | Note says "second page"; the sheet sits directly under the chip row. No pagination exists (Load More is a client increment) |

The 18-cuisine list in the notes is **not implementable as written**: it mixes cuisines
(Italian, Chinese), a drink (Arabica), a fish (Tuna), and a language (Amharb). It would
become 18 hardcoded literals in a client file — the exact defect already present twice.
**Recommendation: derive the filter from `select distinct cuisine from restaurants`.** That
is NEW work and it is the only version of this that doesn't re-create the bug.

---

## 2. Event taxonomy

### Notes
> music · Concert · sport · Theater & performances · Exhibition & Convention ·
> Attractions & Theme park · Custom your own category

### Findings

**This is the one place where the build was ahead of the notes, and where the notes were
right to be suspicious.** `lib/categories.ts` already exists as a single canonical list
(`Music`, `Food & Drink`, `Theatre`, `Exhibition`, `Networking`, `Wellness`, `Community`)
with a docblock warning that inline copies drift.

The drift had happened:

| Surface | List | Verdict |
|---|---|---|
| Chip row | `EVENT_CATEGORIES` (canonical) | correct |
| Create-event form | `EVENT_CATEGORIES` | correct |
| **Filter sheet** | `Concerts`, `Brunch`, `Parties`, `Networking`, `Theatre`, `Food & Drink` | **three dead facets** |

`Concerts` can never match category `Music`; `Brunch` and `Parties` match no canonical
value. Selecting any of the three produced an **empty grid** while the sheet still reported
"Show N results".

Also fixed in the same pass: `matchesFilters` split every facet label into words and matched
any one of them, so `Middle Eastern` matched any listing containing "eastern". Multi-word
facets now require the whole phrase.

**Recommendation on the notes' own list:** `Sport`, `Attractions`, `Convention` and
`Theater` are genuinely missing from the product. If wanted, add them to `EVENT_CATEGORIES`
— never to a screen.

---

## 3. Consumer surfaces

| Note | Class | Finding |
|---|---|---|
| "Bole / Addis Ababa" branch cards | FIX | Branch strip rendered name + address with **selection carried by background colour alone** — no `aria-pressed`, no marker. Two branches of the same venue share a name, so the cards came out identical and the only difference was which was orange (`RestaurantDetail.tsx:195-214`) |
| Phone number on venue | FIX | `branches.phone` was selected in every restaurant detail query (`queries.ts:105,120`) and rendered **nowhere** |
| "Getting there" GO / BOOK RIDE | — | Accurate on the restaurant page — "Go" and "Book Ride" both open the fare planner and the card is titled *Getting there*, so the pairing is coherent. **Left as-is** |
| "PENDING HOURS not provided" | FIX | Not a pending state. `opening_hours` is read straight off the row and rendered; there is no `hours_status` column. The truthful copy for absent hours is *"Opening hours not provided"* (`RestaurantDetail.tsx:274`) |
| Events filter sheet (Concerts/Brunch/Parties/Theatre/Food & Drink) | FIX | §2 |
| "Instant confirmation · No prepayment required" | **NEW** | `booking_mode` exists but `reserve_table` always inserts `'pending'` (`0007:70`). **This copy is a lie today** — `spec/02-gap-analysis.md` S9. Flagged as a release blocker, not a UI fix |
| Reserved table + confirmation screen | FIX | Present and correct |
| Ticket checkout (attendee info, pay on arrival, platform fee, Get Ticket) | **NEW** | There is no payment step. `complete_purchase` hardcodes `payment_status='paid'` (`0007:206-217`). Checkout = reserve inventory + issue a QR |
| Restaurant detail "Modern Addis" / "Verified" / rating / cuisine / hours | FIX | All present and truthful |

### Multi-tier purchase is not atomic — carried from `02-gap-analysis.md` N11
`EventDetail.tsx:126-131` buys tiers in a loop and `break`s on the first failure, then
reports partial success as full: *"Purchased 3 tickets successfully"* with no indication
tier B failed. **Not fixed in this pass** — the fix is in `purchaseTickets`, not the UI.

---

## 4. Partner console

### Notes
> Restaurant settings: My profile (logo, profile background photo, change location or add
> branch, change opening hour, change booking mode, equipment & about add, add cuisine
> type, add or edit photo) · Menu management (upload new menu, edit menu, add menu manually)
> · Request booking (customer name, time, guest count → Restaurant dashboard: accept,
> decline, suggest new time) · Slot mode (10 table per slot, time slot + operating hours,
> slot duration, manage table capacity, add table → add capacity) · Booking rules (prep:
> no deposit / fixed / % of bill, cancellation policy, refund policy, max people per booking)
> · Help & support, analytics, payments · Feature of Restaurant: Owner (full access),
> Manager (bookings, menu, reports), Receptionist (reservations, check-ins),
> Waiter (payments, split bills)

### Findings

| Note | Class | Finding |
|---|---|---|
| My profile: logo, background photo | **PRESENT** | `partner-profile-editor.tsx:66,70` |
| Change location / add branch | **PRESENT** | `branch-manager.tsx:344-438` — under Listings, not Settings |
| Change opening hour | **PARTIAL → NEW** | Exists (`branch-manager.tsx:720-800`) but collapses to **one range per day** and has no "closed day", so a split shift is impossible and `open === close` yields zero slots with no explanation |
| Change booking mode | **PARTIAL** | Exists per branch. `closed` ("Walk-in only") is **read by nothing** — the branch keeps taking bookings (`02-gap-analysis.md` S9) |
| Equipment | **NEW** | No column, no field |
| About | **PRESENT** | `partner-profile-editor.tsx:60` |
| Add cuisine type | **PARTIAL** | Free-text single string, not a list. Root cause of §1's filter problem |
| Add / edit photo | **PARTIAL** | Exactly two slots: `logo_url` + `cover_url`. No gallery table exists |
| Menu: upload / edit / add manually | **PRESENT** | PDF + photo OCR importer (`menu-importer.tsx`), edit modal, add dish |
| Request booking: accept / decline / suggest new time | **PARTIAL** | Suggest and decline exist. **The operator cannot accept a suggested time** — `accept-suggested-time.tsx` is rendered only on consumer pages (`reservation-form.tsx:275`, `settings/page.tsx:105`); the dashboard shows read-only text |
| Slot mode: 10 tables per slot | **NEW** | `booking_configs` has no slot-count column |
| Slot mode: time slot + operating hours | **PARTIAL** | Duration exists (`slot_duration_minutes`); "slots per hour" does not |
| Slot mode: manage table capacity | **PARTIAL** | Two integers (`total_tables`, `max_guest_per_table`). No per-table entity, so "Add table → Add capacity" has nothing to add to |
| Booking rules: prepayment (none / fixed / %) | **NEW** | Exists only in the **frozen** Prisma schema (`packages/database`) and the retired NestJS backend. Not in the live Supabase schema |
| Booking rules: cancellation policy | **PARTIAL** | Free text, shown to diners in the config preview — but **`advance_notice_hours` is read by no code** |
| Booking rules: refund policy | **NEW** | Zero hits repo-wide |
| Booking rules: max people per booking | **PARTIAL** | Only `max_guest_per_table` — per *table*, not per *booking* |
| Role: Owner | **PRESENT** | Single owner: `businesses.owner_id` (`0015_partner_owner_uniqueness.sql`) |
| Roles: Manager / Receptionist / Waiter | **NEW** | No `staff`, `team_members`, `business_members` or invite table. `profiles.role` is a 4-value account enum, not a per-business job |
| Help & support / analytics / payments | **PARTIAL** | Analytics present. No support surface, no payments |

---

## 5. GrowUp promotions

### Notes
> Premium subscription (monthly/yearly, featured listing, featured on home, advanced
> analytics, upload more videos/photos, priority support, premium badge, higher search
> ranking) · Sponsored Ad (set budget + duration, labelled Sponsored — banner ad) ·
> Featured Spot (set budget + duration, featured on profile, appear on home page/category
> upper part) · Offers & Deals (create offer: restaurant name, duration, budget, audience)

### Findings

**Everything in this section is NEW.** The tables `offers` (`0002:185-196`) and `promotions`
(`0002:198-209`) exist with RLS, and **no query in the app reads either**. The `subscriptions`
table is read exactly once — to count followers.

There is no self-serve checkout. Both partner settings pages say so on the record:

> `organizer/settings/page.tsx:126`, `restaurant/settings/page.tsx:137`

The "Boost Your Event → Boost Now" CTA in the console shell links to those anchors
(`console-shell.tsx:251-260`). **That link is correct.** `spec/02-gap-analysis.md` X2 and
`docs/ui-audit-2026-10-08.md:163` both record it as pointing at the consumer `/plans` —
**both are stale**. Trust the current source.

### Correction to make in the pricing copy
`RideOption.providerName` said `"Meter Taxi"` on all three rows, was never rendered, and two
pages promised fares *"across providers"*. One operator, three vehicle tiers is the truth.
Field deleted, copy corrected — §7 F-01.

---

## 6. Deferred — needs a decision, not a ticket

| # | Item | Why it needs a decision |
|---|---|---|
| N-01 | Per-venue photos / gallery | New table, new upload policy, new moderation path |
| N-02 | Distinct cuisine list | `restaurants.cuisine` is free text. Either add an enum + backfill, or derive the filter with `select distinct`. Deriving is free and removes the hardcoded arrays; backfilling is better long-term and costs a migration |
| N-03 | `events.price_label` is in the schema and read by no consumer query | Dead column — either surface it or drop it |
| N-04 | `menu_items.is_available` is fetched and never rendered | New column needed for item images; the badge is free |
| N-05 | "Real-time table availability" on the home hero | Only true on a restaurant detail page, where slot counts are fetched. Either scope the claim or move it |
| N-06 | `opening_hours` split shifts + closed days | The schema allows two ranges; the UI collapses to one |
| N-07 | Walk-in-only as a dated switch, not a permanent mode | |
| N-08 | Ticket tier **duplicate** action | The mockup says *"edit, duplicate or delete"*. Edit and delete exist |
| N-09 | Organizer event **edit** route | The create page's footer promises *"edit the listing from the Events tab"*. There is no `events/[id]` route |
| N-10 | Dead-code chain: `components/dashboard/index.ts` → `MetricCard`, `ReservationCalendarGrid` → `components/ui/{button,card,input,select}` | The barrel has no importers, so the whole chain is unreachable. **`reservation-calendar.tsx` holds the only Complete/Cancel reservation UI** (`02-gap-analysis.md` R1), so deleting it forecloses a backlog item. Delete the chain or re-adopt it — do not leave it half-dead |
| N-11 | Rebrand to FoodRide navy/gold, or keep the ember/gold/ink glass theme | Product decision |

---

## 7. Fixed in this pass

| # | Fix | Files | Verified |
|---|---|---|---|
| F-01 | `providerName`/`providerLogo` deleted from `RideOption`; the two pages promising fares "across providers" now describe what happens — one operator, three tiers | `lib/rides.ts`, `app/ride/page.tsx`, `app/page.tsx` | `rides.test.ts` 11/11 |
| F-02 | "Trending Restaurants" was `created_at desc` — the six newest listings. Now sorted by rating and titled **Top Rated Restaurants** | `app/page.tsx` | typecheck |
| F-03 | "This Week's Events" rendered whatever came next in a `starts_at` ordering, possibly next month. Now scoped to seven days, falling back to **Coming Up** when the week is quiet — so the heading is never false | `app/page.tsx` | typecheck |
| F-04 | Event filter sheet's three dead facets (`Concerts`, `Brunch`, `Parties`) replaced with the canonical `EVENT_CATEGORIES`, each with its own icon | `components/ExploreCatalogue.tsx`, `lib/categories.ts` | typecheck |
| F-05 | Multi-word facets matched on any single word (`Middle Eastern` → `eastern`). Now require the whole phrase | `components/ExploreCatalogue.tsx` | typecheck |
| F-06 | Branch selector: `aria-pressed`, a check marker on the selected card, and an ordinal so same-named branches are distinguishable. Group is labelled | `components/RestaurantDetail.tsx` | typecheck |
| F-07 | `branches.phone` — selected since it was written, rendered nowhere — now a `tel:` link beside the address | `components/RestaurantDetail.tsx` | typecheck |
| F-08 | Ticket tier display vocabulary derived from `ticketTierEnum` instead of testing for `'vvip'`, a value that has never existed in the database. `early_bird` and `group` were rendering **no label at all** | `components/EventDetail.tsx`, `lib/supabase/queries.ts`, `lib/validation.ts` | typecheck |
| F-09 | "Go / Navigate" and "Book Ride" pointed at the same URL. **Go** now opens maps directions; **Book Ride** opens the fare planner. "View Map" likewise | `components/EventDetail.tsx` | typecheck |
| F-10 | Organizer credited as their own email local part (`sky.garden` for "Sky Garden"). `organizers.name` is now selected and rendered, with the email as fallback | `lib/supabase/queries.ts`, `components/EventDetail.tsx` | typecheck |
| F-11 | Hardcoded **"Addis Ababa"** on every event — `events` has no city column. Replaced with the real category; the fabricated *"Creating unforgettable experiences in Addis Ababa"* organizer tagline replaced with a link to the organizer's real public profile | `components/EventDetail.tsx` | typecheck |
| F-12 | Quantity steppers were **28px** — under half the 44px minimum — on the control that decides how many tickets someone is charged for. Now 44×44 with a live-region count | `components/patterns/TierRow.tsx` | typecheck |
| F-13 | `PremiumBadge` deleted — a second, conflicting rendering of a concept `TierRow` already renders | `components/patterns/Badges.tsx`, `index.ts` | typecheck |

### Checked and found **not** to be defects

Recorded so they are not re-litigated:

- **"7 cards on first paint"** in the catalogue. Not an off-by-one. `PAGE_SIZE = 6` counts
  *grid* cards; the lead card at `ExploreCatalogue.tsx:373` is a documented, deliberate
  addition (`// Lead card — the top-rated result, not an editorially "featured" one`).
- **Restaurant "Go" and "Book Ride"** sharing a URL. Correct — that card is titled
  *Getting there* and both actions mean "open the fare planner". Only the **event** page's
  pair was wrong, because one of them is labelled "Navigate" (F-09).
- **The two `components/ui` primitive sets.** A claim that `components/ui` has zero
  importers is **wrong**: `metric-card.tsx` and `reservation-calendar.tsx` import it
  relatively (`../ui/card`), which a search for `components/ui` misses. They are reachable
  only through `components/dashboard/index.ts`, which itself has no importers — see N-10.
  The files were **left in place**; deleting them would have broken the build for a reason
  that turned out to be untrue.

---

## 8. Verification

`npx tsc --noEmit -p apps/web/tsconfig.json` clean ·
`npm run lint --workspace=@urbanexplore/web` warnings-only, all pre-existing ·
`npm test --workspace=@urbanexplore/web` **69/69**.

No test was added for this pass. The regressions guarded against here are copy and
presentation, and the repository's own convention (`docs/ui-audit-2026-10-08.md` §5) is
that static confirmation does not settle layout, contrast or overflow — those want a
rendered pass at 320/375/768/1280 in light and dark.

**The next batch is resilience, not truthfulness:** `/restaurants` and `/events` have no
route-level `loading.tsx` or `error.tsx`, and `lib/catalogue.ts:101-105,149-153` returns
`{ items: [] }` on a failed query. A backend outage renders as a clean empty catalogue, and
`SkeletonCard`/`SkeletonList` already exist unused for the loading half of it.

---

## 9. Notes for the next agent

- **Verify at source.** Every finding here carries `file:line`; three items in the input
  material (the "off-by-one", the "0 importers" claim, the stale "Boost Now → `/plans`"
  routing) were wrong when first reported and were caught only by re-reading the code.
- **`spec/02-gap-analysis.md` remains the authority on security and data integrity.** This
  document deliberately does not restate it. The security items it lists as P0 are still
  open, including C5 — *a partner listing is not actually gated on moderation* — which
  makes the marketplace's central promise "a listing means an admin vouched for it"
  currently unenforced.
- **One canonical list per concept.** `lib/categories.ts` for event categories,
  `ticketTierEnum` for ticket tiers. Both bugs in this pass came from a screen re-listing
  what a shared module already owned. When adding a facet, add it to the shared module.
- **Do not present a claim the data does not support.** That is the whole of this pass:
  "trending" that was newest-first, "across providers" that was one provider, a Premium
  tier that tested for a value the database cannot store.
