# Stitch Export → Codebase Porting Map

Source: `stitch_urbanexplore_addis_ababa_marketplace/` (20 screens, each `code.html` + `screen.png`, system spec in `urbanexplore/DESIGN.md`).
Stitch followed our token system exactly (ivory #FCF9F8 / navy #0B1F3A / gold #C2A878+#927140, Playfair+Inter, snap carousels, pill bottom nav) — so porting = layout/content alignment, not re-theming.

| Stitch screen | App target | Status | Notes |
| --- | --- | --- | --- |
| `urbanexplore_home` | `app/page.tsx` | ✅ structure matches | Adopt real Addis sample content: Castelli Restaurant, Kategna, Ethio-Jazz Night Under the Stars (seed data candidates); check hero wash + trust strip spacing against HTML |
| `explore_restaurants` | `components/ExploreCatalogue.tsx` (restaurants) | ✅ **ported** | Meta line now uses live `closing_label` ("Open until …") instead of duplicating the ★ rating; featured-card/grid treatment already matched |
| `find_events` | `ExploreCatalogue.tsx` (events) | 🟡 partial | Date badges + grid anatomy match; **sold-out ribbon/waitlist state deferred** until an availability column exists in the events query (won't fake a Waitlist action) |
| `restaurant_detail` | `components/RestaurantDetail.tsx` | 🟡 close | Per-day Opening Hours table w/ today highlighted + Atmosphere snap-strip gallery ported; true "next slot" banner deferred (needs reservation-count plumbing) — hours derive from real per-day data |
| `event_detail` | `components/EventDetail.tsx` | ✅ close | TierRow panel + navy stub already built; compare info-card + location card details |
| `go_book_ride` | `components/RidePlanner.tsx` | ✅ close | Upfront framing + context card + radio list shipped in slice D |
| `role_picker` | `app/auth/role/page.tsx` | ✅ done | |
| `consumer_signup` | `app/auth/signup/user/page.tsx` | ✅ **ported** | Shared `SignupStepper` (Account→About You→Preferences), gold-active chip multi-selects, "Curate your experience" serif step 3 with dividers, sticky navy CTA bar ("Complete Setup"), eyebrow field labels |
| `business_profile` | `app/auth/signup/business/page.tsx` | ✅ **ported** | "UrbanExplore Partners" hero band, Visual Assets tiles (logo square + cover wide), Legal & Verification block w/ gold verified-review callout, `n / 500` char counter, contextual CTAs, Addis placeholders. Upload wiring to storage = follow-up |
| `organizer_signup` | `app/auth/signup/organizer/page.tsx` | ✅ **ported** | Payout Details card (4 Ethiopian banks, OPTIONAL·SECURE pill, docs dropzone) persisted as additive `org_payout_*` metadata, authority ConsentCheckbox gating submit, logo tile w/ 512px guidance, "Create organizer account" |
| `sign_in` | `app/auth/signin/page.tsx` | ✅ **ported** | Error banner anatomy (icon + humanized copy) + email-not-confirmed pending state mirroring signup's "Check your email" card, incl. resend |
| `my_account` | `app/settings/page.tsx` | ✅ **ported** | Ticket-stub wallet shipped earlier; reservations empty state now matches tickets' dashed-gold treatment; dead role-pill conditional removed |
| `partner_overview` | `app/dashboard/restaurant/page.tsx` | ✅ **ported** | Dark console (#07192B/#0B1D31), KPI grid (real counts only — no fake trends), today's timeline w/ inline confirm/reject via server action + contacts RPC; trends deferred until historical data exists |
| `reservations_inbox` | `app/dashboard/restaurant/reservations/page.tsx` | ✅ **ported** | Dark console; Day/Week/Month segmented control, live status-count chips, slot-grouped rows w/ inline confirm/reject |
| `menu_manager` | `app/dashboard/restaurant/menu/page.tsx` | ✅ **ported** | Console primitives extracted to `components/dashboard/console.tsx`; search + category tabs + initials-tile rows + ETB Playfair prices + ToggleSwitch + add/edit modal (bottom sheet mobile / dialog desktop). **Fixed live bug: toggle wrote `isAvailable`, column is `is_available`**; multi-branch chips when >1 branch |
| `branch_configuration` | `components/dashboard/branch-manager.tsx` | ✅ **ported** | Numbered sections, booking-mode radio cards (Walk-in Only/Time Slots/Request Mode verbatim), −/+ steppers, cancellation-policy textarea (**schema+action extended**, column pre-existed), live "Guests see:" preview strip, dirty-check Unsaved changes/Discard/Save bar; hours editor kept as console card |
| `analytics_dashboard` | `app/dashboard/{restaurant,organizer}/analytics/page.tsx` | ✅ **ported (honest)** | Server components; range links 7d/30d/90d, KPI trend vs prior window (neutral "—" when empty), dependency-free gold SVG sparkline, daypart split, most-requested slots (restaurant) & top events by paid revenue (organizer). Conversion/Est.Rev/Top-Dishes intentionally omitted — no tracking source exists yet |
| `admin_dashboard` | `app/dashboard/admin/*` | ✅ **ported** | Live-ops KPI strip w/ gold accent slot, Pending Verification queue w/ inline Verify/Reject server action (`setBusinessVerification`, system_admin-only + audit log), Directory table w/ `?q=` search over businesses+organizers, mono audit-log feed; **admin route guard added** (non-admins redirected); users/businesses/events subpages scaffolded so sidebar links resolve |

## Porting rules
1. Layout/content from Stitch HTML; colors/fonts → our tokens (`app-*`, `gold`, `navy`, Playfair via `font-serif`) — never copy its raw palette classes.
2. Real interactivity stays ours: Supabase queries, server actions, RPCs. Stitch markup is visual-only.
3. Mobile-first per artboard; adapt to desktop with our breakpoints.
4. One screen per PR-sized commit; run `tsc --noEmit` + build before committing.

## Suggested order (2026 status)
1. ~~`partner_overview` → reservations inbox~~ ✅ done
2. ~~`my_account` ticket wallet~~ ✅ done
3. ~~Signup wizards (3 screens share one stepper pattern)~~ ✅ done — `SignupStepper`, `FileUploadTile`, `PayoutDetailsFields`, `ConsentCheckbox`
4. ~~Remaining dashboard screens (menu, branches, analytics, admin)~~ ✅ done — console primitives in `components/dashboard/console.tsx`
5. Consumer fine-tuning passes using HTML diffs — ✅ done except: events sold-out state (blocked on availability data) and restaurant "next slot" banner (blocked on reservation-count plumbing)

## Follow-ups flagged during the port
- Wire signup upload tiles + partner verification docs to a storage bucket (currently client-state only).
- `org_payout_*` metadata needs a consumer when paid event publishing ships.
- Events catalogue sold-out treatment once availability (`remaining_quantity`) joins the query.
- Restaurant detail "Open today · until HH:MM" / next-slot banner from real slot counts.
- Retrofit the two originally-shipped console pages onto `components/dashboard/console.tsx` primitives.
