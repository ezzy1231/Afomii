# UrbanExplore — Stitch Prompt Pack

> Paste the **Global Style Preamble** at the start of every Stitch conversation (or into your first prompt), then use one prompt per page.
> Phases match the implementation order in `UI_REDESIGN_V2.md`. Prompts encode our **real data model** (Supabase tables, roles, statuses, ETB pricing) so exported designs map 1:1 to the codebase.
>
> Workflow tips: generate **mobile first**, then ask Stitch to adapt each screen to desktop web. Iterate on one screen per thread. Export → HTML gives Tailwind-ish markup you can port onto our token layer (`app-*`, `gold`, `navy` classes).

---

## Global Style Preamble (paste before every page prompt)

```
Design system for "UrbanExplore" — a premium marketplace for restaurants,
events, and meter-taxi rides in Addis Ababa, Ethiopia. All prices in ETB.

BRAND: Warm editorial premium. Ivory canvas (#FCF9F8 background, #FFFFFF cards),
deep navy chrome (#0B1F3A), antique gold accents (#C2A878, darker #927140 for
text-on-light). Semantic: green #34A853 success, red #BA1A1A danger, amber #FBBC05 warning.

TYPE: Playfair Display (serif) for headlines, prices in hero contexts, and card
titles. Inter for everything else. Numbers always tabular-nums. Eyebrow labels:
11px uppercase, letter-spacing 0.15em, gold.

SHAPE & MOTION: Card radius 16–24px, pills fully rounded. Soft shadows
(0 4px 20px rgba(0,0,0,.06)). Hover lift -2px. 150ms ease-out transitions.
Press feedback scale 0.98.

MOBILE RULES: thumb-zone sticky bottom action bars on detail screens; floating
pill bottom navigation (5 tabs: Home, Eat, Events, Ride, Account); 44px minimum
touch targets; horizontal scroll-snap carousels that become grids on desktop.

DARK MODE: partner/admin surfaces are dark navy (#07192B bg, #0B1D31 cards,
ivory text #F5EFE8, gold #D7B778 accents). Consumer surfaces are light-first
with correct dark variants.

STATES: every list needs a skeleton shimmer variant, an empty state with icon +
one-line message + CTA, and error/retry.
```

---

## Phase 1 — Consumer discovery core

### 1.1 Home — `/`
```
Mobile home screen for UrbanExplore (light theme, warm editorial).
Top: minimal navy glass header — serif wordmark left, notification bell + avatar right.
Hero on ivory with soft gold radial wash: eyebrow "ADDIS ABABA · EAT · GO OUT · GET THERE",
large serif headline "Find a place you'll love.", subline, unified search bar
(magnifier + "Restaurants, events…" placeholder + filter icon button).
Below: trust strip row of 3 small items with icons (Verified partners only ·
Real-time table availability · Fares in ETB upfront).
Category chip row with icons, horizontally scrollable: Restaurants, Events,
Rides, Cafés, Bars.
"Trending Restaurants" section: section header with serif title + gold eyebrow
"MOST BOOKED THIS WEEK" + "See all" link; horizontal snap carousel of large
photo cards (4:3 image, rating pill top-left, heart button top-right, serif
name, location pin line, category · open-until meta).
"This Week's Events": featured full-bleed poster card (image with dark navy
gradient overlay, white date-badge block showing month/day, serif title,
venue, gold price pill "From ETB 350", small gold "Book now" button);
below it two compact event rows (date badge, title, venue, price pill).
Navy promo banner "Book it. Then ride." with gold CTA "Estimate a fare" and
faded car illustration.
Bottom: floating pill bottom nav, Home tab active (gold icon, navy pill).
```

### 1.2 Restaurants catalogue — `/restaurants`
```
Mobile catalogue screen "Restaurants". Sticky translucent search header with
back chevron, search input, filter icon opening a bottom sheet.
Category chips row (All, Modern African, Japanese, Mediterranean, Café…),
active chip solid navy with white text.
Featured restaurant hero card: full-width photo, dark gradient, "FEATURED"
gold tag, serif name, rating ★ 4.9 pill, gold "Reserve Table" button.
Grid of listing cards below (1 col mobile): photo 4:3, rating pill overlay,
heart save toggle, serif name, location pin + area line, cuisine · open-until
meta row.
Include one card showing a restaurant with no photo (navy-gold gradient with
big serif initial instead of image).
Bottom sheet state (second artboard): filters — sort by, price band ETB
chips (Under 300 / 300–700 / 700+), rating minimum slider, open-now toggle;
gold "Apply" + text "Reset" buttons pinned at sheet bottom.
Empty state artboard: magnifier-off icon, "Nothing matches these filters",
text button "Reset everything".
```

### 1.3 Events catalogue — `/events`
```
Mobile events catalogue, art-directed poster style (Eventbrite × DICE).
Sticky search header + date-range chips (Today, This weekend, This month, All).
Featured event poster: full-bleed image 16:10, navy gradient from bottom,
white date-badge (month/day), serif 28px title, description one-liner,
meta row with calendar icon date · pin venue · white price pill "From ETB 350",
gold "Book Experience" button with arrow.
"Upcoming Experiences" grid: vertical cards — photo top h-40, white date-badge
top-right overlapping image, category eyebrow in gold uppercase, serif title,
two-line description clamp, footer row separated by hairline: gold price pill
left, navy "Book Tickets" mini-button right.
States: sold-out event card with diagonal ribbon and disabled button;
draft/unpublished card greyed at 50% opacity with "Preview" label.
```

### 1.4 Restaurant detail — `/restaurants/[id]`
```
Mobile restaurant detail (Resy/OpenTable feel).
Full-bleed cover photo h-64 with subtle bottom gradient; circular share +
bookmark buttons top-right (44px, frosted circles).
Floating identity card overlapping photo bottom by -56px: rounded-24 white
card with logo tile, serif 22px name, ★ 4.8 · Cuisine line, "PREMIUM" navy
badge with gold text, address row with pin + "Directions" outline button.
Quick-action grid 4 tiles: Menu, Reserve, Follow, Save (icon over label,
bordered tiles, active/toggled state shows gold fill).
Branch strip if multiple locations: horizontal chips "Bole ★ 4.9 · 1.2km".
Content sections: photo gallery strip (snap row), About paragraph, Highlights
list with icons, Cuisine tags as chips, Opening hours table (day rows with
time ranges, today highlighted gold).
Availability banner: green dot "Available now · next slot 7:30 PM".
Sticky bottom dual CTA bar (mobile): secondary outlined navy "Go by Ride" +
primary gold "Book a Table". On desktop show inline booking panel right side.
```

### 1.5 Event detail — `/events/[id]`
```
Mobile event detail, immersive poster treatment.
Full-bleed hero h-72 with navy gradient; white date-badge large (month/day)
bottom-left above serif 30px white title; "Hosted by {organizer} ✓" caption;
heart share circle top-right.
Info card row under hero: clock icon time range + formatted date · map pin
venue + city · "View Map" link.
About the Event paragraph section.
Organizer card: avatar initial tile, name + verified check, follow/following
toggle button.
Location card: muted map placeholder with pin, caption "{venue} — plan your ride".
Right/bottom ticket panel titled "Select Tickets" on navy header band:
tier rows list — each row has tier name (Standard, VIP, Early Bird, Group),
price "ETB 500", live remaining counter "23 left" in amber when < 30, quantity
stepper (- 0 +) with gold plus; selected row highlighted gold tint.
Total row: "Total" + large serif tabular amount "ETB 1,000"; primary gold
full-width "Book 2 Tickets" button; below it two square quick actions side by
side: "Go / Navigate" and "Book Ride / Get there" on gold-tinted tiles.
Signed-out state: gold info banner "Sign in to buy tickets" with link.
Success artboard: navy perforated ticket stub — gold top band, big check in
gold ring, serif "You're going!", dashed tear line with notch circles, ticket
code in mono on frosted panel, caption "Screenshot this or find it in your
tickets", gold "View my tickets" + outlined "Browse more events".
```

---

## Phase 2 — Rides

### 2.1 Ride planner — `/ride`
```
Mobile ride planning screen (Bolt-like utility clarity, light theme).
Header: back circle, serif title "Go & Book Ride", subtitle "Fare upfront in
ETB · meter rates, no surge", navy "SECURE ✓" pill right.
Context card when arriving from a place: photo thumb + "Getting to {Restaurant}"
+ "Destination set · tap trip card to change", chevron.
Route card: pickup dot (navy ring) with input "Current location detected — tap
to refresh", connector line, destination dot (red) input "Where to?".
Manual distance fallback inside dashed gold border: label "Trip distance (km)
— works without maps", numeric input, navy Compare button.
Optional map preview card h-52 with route polyline in gold; caption "Map is
optional — fares work with distance only."
"Choose a ride" panel: header row with serif title + green trust pill
"Fare upfront · ETB · No surge". Radio option rows: provider monogram tile,
tier name + sublabel, ETA minutes column, bold tabular price "ETB 172"
labeled UPFRONT, badge chips Fastest / Best Value, radio circle right;
selected row gold-tinted.
Sticky bottom summary bar: time · distance km · passengers 1–4 · secure pay;
dual CTA — outlined "Go / Open navigation" + gold "Book · Meter Taxi / ETB 172".
Loading state: three skeleton option rows shimmering.
```

---

## Phase 3 — Auth & onboarding

### 3.1 Role picker — `/auth/role`
```
Onboarding role selection screen (light). Centered serif headline "How will
you use UrbanExplore?", gold eyebrow "GET STARTED", subline "One account for
dining out, going out, and getting there."
Three elevated cards (stacked mobile, 3-col desktop) each with tinted round
icon (rose user globe / orange storefront / violet calendar), serif role title
(User · Food & Dining Business · Events & Entertainment), one-line description,
check-list of 4 benefits, navy CTA ("Continue as User" / "List My Venue" /
"List My Events"). Cards have gold hover ring and staggered fade-in-up.
Footer: "Already have an account? Sign in".
```

### 3.2 Consumer signup wizard — `/auth/signup/user`
```
Three-step mobile signup wizard, ivory background, centered card.
Persistent labeled progress stepper top: ① Account ② About you ③ Preferences
(completed = navy filled check, current = gold ring, upcoming = muted).
Step 1: email, phone, password fields with floating labels, gold focus rings,
inline validation message example, primary navy Continue.
Step 2: full name, city select (Addis Ababa neighborhoods), language chips
(English / አማርኛ), country selector.
Step 3: dietary preferences as multi-select chips (Vegetarian, Vegan,
Pescatarian, Keto, Halal, Orthodox fasting) + allergies chips (Peanuts,
Dairy, Gluten, Shellfish, Eggs) with selected state gold-filled; optional
birth date field with Ethiopian/Gregorian calendar toggle; gender select.
Sticky bottom bar: Back (text) + Continue (gold). Success → home feed.
Show step 3 as the main artboard with 1 and 2 as smaller variants.
```

### 3.3 Business signup — `/auth/signup/business`
```
Two-screen partner onboarding for food businesses (light, trustworthy).
Screen A "Create your business profile": progress stepper (Business → Contact
→ Listing), fields: business name, category select (Restaurant/Café/Bakery/
Bar/Juice house), description textarea with counter, logo upload tile with
plus, cover upload wide tile, license upload note "For verification".
Screen B "First branch": branch name, address with map pin, phone, city,
opening hours editor rows (day, open time, close time, add-hours "+"),
seating summary (tables count, max guests/table stepper).
Gold info callout: "Listings go live after a quick verification review."
Primary navy Continue / Back pair pinned bottom.
```

### 3.4 Organizer signup — `/auth/signup/organizer`
```
Partner onboarding for event organizers (light). Progress stepper
(Organization → Contact → First event).
Fields: organization name, type chips (Promoter · Venue · Community ·
Nightlife · Culture), bio textarea, logo tile, contact email/phone/website.
Second artboard: payout details card (bank name, account number, account
holder) marked optional-secure with lock icon, and verification docs upload
row.
Consent checkbox + navy "Create organizer account" CTA; link back to role picker.
```

### 3.5 Sign in — `/auth/signin`
```
Compact sign-in screen (light, centered max-w-sm card on ivory).
Serif welcome "Welcome back", email + password inputs, gold focus rings,
primary navy full-width "Sign in", divider "or", Google OAuth button
(outlined with G mark), links: "Forgot password?" and "New here? Choose your role".
Error state variant: red inline banner "Invalid email or password".
Also show magic-link/email-confirm pending state: envelope icon + "Check your
inbox to confirm your email" + resend timer.
```

---

## Phase 4 — Consumer account

### 4.1 Settings / My account — `/settings`
```
Mobile account hub (light). Header with avatar, name, role chip "Customer",
edit pencil.
Sectioned white cards:
Profile — name, phone, city, language rows with chevrons.
Food profile — dietary preference chips + allergy chips shown as selected
pills, edit affordance.
My reservations — list rows: venue serif name, date/time, guests, status pill
(PENDING amber, CONFIRMED green, REJECTED red, CANCELLED grey, COMPLETED navy);
cancel action on upcoming ones; empty state "No reservations yet — explore
restaurants" with CTA.
My tickets — DICE-style ticket stubs stacked: navy stub, event name serif,
date badge, QR placeholder square, status (upcoming/attended), tear-line edge.
Session — theme toggle (light/dark preview), sign out red text button.
```

---

## Phase 5 — Restaurant partner dashboard (dark navy console)

Use this preamble addition for all Phase 5–7 prompts:
```
PARTNER CONSOLE THEME: deep navy background #07192B, cards #0B1D31 radius
20px, borders rgba(215,183,120,.25), text ivory #F5EFE8 (secondary at 70%),
gold #D7B778 reserved for KPIs, active nav and primary buttons. Sidebar
navigation on desktop (logo, Overview, Reservations, Menu, Branches,
Analytics, Settings); on mobile a top horizontal tab strip plus the standard
bottom nav. KPI numbers large serif-free tabular with trend arrows ▲▼.
```

### 5.1 Restaurant overview
```
Dashboard overview (dark console). Greeting "Good evening, {business} 👋" serif.
4 KPI cards: Upcoming reservations 12 ▲8%, Covers today 46, Menu items 24,
Profile views 1,208 ▲12% (gold numerals, trend arrows green/red).
"Today's reservations" timeline list: time slot, guest name + party size,
status pill (pending amber / confirmed green / completed navy), inline quick
actions Confirm ✓ Reject ✕ as icon buttons.
Right rail (desktop): quick actions card — Add menu item, Add branch,
View public page; and a mini 7-day bookings sparkline card.
Empty-state variant for new partners: dashed panel "No reservations yet —
publish your listing and share your page" with gold CTA.
```

### 5.2 Reservations inbox
```
Reservations management (dark console). Header with Day | Week | Month
segmented control (Day active gold) + date picker chip.
Slot-grouped list: time heading "18:00 — 3 tables", rows with guest name,
party size chip, occasion note, status pill, actions Confirm / Propose new
time / Reject (overflow menu). Row height ≥56px, swipe-reveal actions on
mobile artboard.
Filter chips: All, Pending, Confirmed, Completed.
Bulk bar appears when selecting rows: "2 selected · Confirm all".
```

### 5.3 Menu manager
```
Menu manager (dark console). Category tabs across top: Appetizers · Mains ·
Grills · Drinks · Desserts (active gold underline) + search.
Item rows: thumbnail 48px, name, description clamp, price "ETB 320"
tabular right, availability toggle switch (green on), overflow edit/delete.
"+ Add item" gold ghost button ends list.
Edit item modal artboard: photo upload, name, description, price input with
ETB prefix, category select, available toggle, Save/Cancel.
```

### 5.4 Branches & booking config
```
Branch settings (dark console). Branch selector chips (Bole · Kazanchis · + Add).
Per-branch config form in cards: Booking mode segmented control (Walk-in /
Time slots / Request — Time slots active), Total tables stepper, Max guests
per table stepper, Slot duration select (30/45/60 min), Advance notice hours,
Cancellation policy textarea, Daily capacity number.
Live preview strip: "Guests see: Instant confirmation · up to 8 guests ·
free cancellation 2h".
Save bar sticky bottom: "Unsaved changes" + Discard + gold Save.
```

### 5.5 Analytics
```
Analytics screen (dark console). Range chips 7d / 30d / 90d.
KPI row: Reservations, Covers, Conversion (views→booking %), Est. revenue ETB
with trends.
Large line/area chart card "Bookings over time" with gold line on navy grid;
secondary bar chart "Covers by daypart".
Top dishes list (name, orders, revenue share bar) and traffic sources chips.
Export CSV ghost button.
```

---

## Phase 6 — Organizer dashboard (same dark console)

### 6.1 Organizer overview
```
Overview (dark console): greeting, 4 KPIs — Events live 3, Tickets sold 428 ▲,
Attendance rate 87%, Gross sales ETB 96,400 (gold serif-free tabular).
Recent orders list with buyer initial avatar, tier chip (Standard/VIP/
Early Bird), quantity, ETB amount, time ago.
Next event countdown card: poster thumb, "Night Market Sessions · Fri 19:00",
progress bar "312/400 sold", gold "Manage" button.
```

### 6.2 Calendar + events list
```
Month calendar (dark console): grid with event dot chips colored by status
(published gold, draft grey outline, completed navy), tapping a day opens
that day's events popover with create CTA.
Events list artboard: tabs Upcoming / Drafts / Past; rows with poster thumb,
title serif, date · venue, tickets sold progress bar, status pill, Edit and
Publish/Unpublish buttons.
Create Event wizard entry button prominent gold "+ Create event".
```

### 6.3 Create-event wizard + tier editor
```
5-step Create Event wizard (dark console) with labeled stepper:
Basics (title, category chips, description) → Venue (name, map pin, city) →
Date & time (start/end datetime pickers) → Tickets → Publish.
Ticket step focused artboard: tier editor rows matching public TierRow —
tier select (Standard/VIP/Early Bird/Group), name, price ETB, quantity,
sales window dates, live preview card on right showing exactly how buyers
will see it (poster card with price pill).
Publish step: checklist (cover image set ✓, at least one tier ✓, description
✓) + summary card + gold "Publish now" and ghost "Save draft".
```

---

## Phase 7 — Admin (dark console, restricted feel)

### 7.1 Admin dashboard
```
Platform admin (dark console, denser). Top metrics: Total users, Businesses,
Organizers, Active listings, GMV estimate ETB — small trend arrows.
Moderation queue card: pending businesses/organizers rows with verify/reject
actions and submitted doc thumbnails.
Tables (users, listings, events) with search, role/status pills, row menus;
audit log stream right rail: actor, action, entity, timestamp in mono.
Danger-zone styling: reject actions red-outline.
```

---

## Generation order & tips

1. Generate in phase order — reuse the same thread for a phase so Stitch keeps components consistent.
2. Always generate the mobile artboard first, then say *"Adapt this screen to desktop web (max-width 1280)"*.
3. Ask for explicit state variants as separate artboards (loading skeletons, empty, error, success).
4. When exporting, keep class names close to ours: swap its grays → `app-*` tokens, its accent → `gold`/`navy`, radii → 16–24px, font stacks → Playfair/Inter variables.
5. Port priority after export: Phase 1 pages first (they ship), dashboards second.
