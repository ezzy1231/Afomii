# Stitch Export → Codebase Porting Map

Source: `stitch_urbanexplore_addis_ababa_marketplace/` (20 screens, each `code.html` + `screen.png`, system spec in `urbanexplore/DESIGN.md`).
Stitch followed our token system exactly (ivory #FCF9F8 / navy #0B1F3A / gold #C2A878+#927140, Playfair+Inter, snap carousels, pill bottom nav) — so porting = layout/content alignment, not re-theming.

| Stitch screen | App target | Status | Notes |
| --- | --- | --- | --- |
| `urbanexplore_home` | `app/page.tsx` | ✅ structure matches | Adopt real Addis sample content: Castelli Restaurant, Kategna, Ethio-Jazz Night Under the Stars (seed data candidates); check hero wash + trust strip spacing against HTML |
| `explore_restaurants` | `components/ExploreCatalogue.tsx` (restaurants) | 🟡 partial | Compare featured-card treatment + grid card meta rows; filter sheet artboard exists in HTML |
| `find_events` | `ExploreCatalogue.tsx` (events) | 🟡 partial | Poster featured card + upcoming grid already shipped in v2; verify date-badge placement + sold-out/draft states |
| `restaurant_detail` | `components/RestaurantDetail.tsx` | 🟡 partial | Check branch chips, gallery strip, hours table, availability banner ("next slot") — some may be new UI |
| `event_detail` | `components/EventDetail.tsx` | ✅ close | TierRow panel + navy stub already built; compare info-card + location card details |
| `go_book_ride` | `components/RidePlanner.tsx` | ✅ close | Upfront framing + context card + radio list shipped in slice D |
| `role_picker` | `app/auth/role/page.tsx` | ✅ done | |
| `consumer_signup` | `app/auth/signup/user/page.tsx` | ⬜ TODO | Stepper + dietary/allergy chips screen — port layout into existing wizard |
| `business_profile` | `app/auth/signup/business/page.tsx` | ⬜ TODO | Two-step partner onboarding incl. first-branch form + hours editor |
| `organizer_signup` | `app/auth/signup/organizer/page.tsx` | ⬜ TODO | Org type chips, payout card |
| `sign_in` | `app/auth/signin/page.tsx` | 🟡 minor | Verify error banner + email-confirm pending state styling |
| `my_account` | `app/settings/page.tsx` | 🟡 tickets done | Ticket-stub wallet grid (navy perforated cards) + onboarding empty state shipped; profile/account card polish remains |
| `partner_overview` | `app/dashboard/restaurant/page.tsx` | ✅ **ported** | Dark console (#07192B/#0B1D31), KPI grid (real counts only — no fake trends), today's timeline w/ inline confirm/reject via server action + contacts RPC; trends deferred until historical data exists |
| `reservations_inbox` | `app/dashboard/restaurant/reservations/page.tsx` | ✅ **ported** | Dark console; Day/Week/Month segmented control, live status-count chips, slot-grouped rows w/ inline confirm/reject (Stitch artboard mixed themes — structure ported into established console theme) |
| `menu_manager` | `app/dashboard/restaurant/menu/page.tsx` | ⬜ TODO | Category tabs + item rows w/ availability toggle + edit modal |
| `branch_configuration` | `components/dashboard/branch-manager.tsx` | ⬜ TODO | Segmented booking-mode control + live preview strip + sticky save bar |
| `analytics_dashboard` | `app/dashboard/*/analytics/page.tsx` | ⬜ TODO | Chart cards (gold line on navy grid), top-dishes list |
| `admin_dashboard` | `app/dashboard/admin/page.tsx` | ⬜ TODO | Metrics + moderation queue + tables + audit stream |

## Porting rules
1. Layout/content from Stitch HTML; colors/fonts → our tokens (`app-*`, `gold`, `navy`, Playfair via `font-serif`) — never copy its raw palette classes.
2. Real interactivity stays ours: Supabase queries, server actions, RPCs. Stitch markup is visual-only.
3. Mobile-first per artboard; adapt to desktop with our breakpoints.
4. One screen per PR-sized commit; run `tsc --noEmit` + build before committing.

## Suggested order
1. `partner_overview` → reservations inbox (dark console is the biggest visual gap)
2. `my_account` ticket wallet
3. Signup wizards (3 screens share one stepper pattern)
4. Remaining dashboard screens (menu, branches, analytics, admin)
5. Consumer fine-tuning passes using HTML diffs
