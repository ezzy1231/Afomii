# UI Archive — ui-v1 (2026-09-07)

Visual snapshot of the UrbanExplore web UI at tag **`ui-v1`** (commit `6d712c2`),
taken **before** the next redesign round. If the next change isn't liked,
revert with:

```
git reset --hard ui-v1
git push origin main --force
```

## What was captured

All screenshots: headless Chrome, 1440×900 desktop (or 390×844 mobile),
local dev server (`npm run dev -w @urbanexplore/web`, port 3000) — which in
dev mode serves **sample data** for restaurants/events, so cards are populated.

### Root captures (local dev)

| File | Route | Notes |
|---|---|---|
| home.png | / | Hero, categories, trending, events |
| restaurants.png | /restaurants | Explore catalogue, save hearts |
| events.png | /events | Events catalogue, date badges |
| ride.png | /ride | Ride fare planner |
| signin.png | /auth/signin | Google + email sign-in |
| forgot-password.png | /auth/forgot-password | |
| signup-user.png | /auth/signup/user | Consumer signup flow |
| signup-business.png | /auth/signup/business | Business signup flow |
| signup-organizer.png | /auth/signup/organizer | Organizer signup flow |
| vision.png | /vision | Product vision |
| about.png | /about | |
| terms.png | /terms | |
| privacy.png | /privacy | |
| system-design.png | /system-design | Design showcase |
| restaurant-detail.png | /restaurants/1 | 1440×2400 full page — menu, branches, reservation form, sticky bar |
| event-detail.png | /events/1 | 1440×2400 full page — ticket tiers, ride actions |
| home-mobile.png | / | 390×844 |
| restaurants-mobile.png | /restaurants | 390×844 |
| plans-mobile.png | /plans | 390×844 (redirected — auth-gated) |

### Redirect captures (auth-gated, no session in headless)

`plans-redirect.png`, `settings-redirect.png`, `dashboard-redirect.png` —
these record the redirect to signin. The **authenticated** views (My Plans
with the Saved tab, settings, restaurant/organizer/admin dashboards) are
fully covered by the `ui-v1` git tag; run the dev server and sign in to
view them.

### production/ (live Netlify deployment, 2026-09-07)

home.png, restaurants.png, events.png, signin.png, ride.png — the live
site state at the same commit.

## Not covered

- Authenticated dashboards (admin/restaurant/organizer) — git tag only
- Dark mode (site uses system preference; captures are light)
- Ride-planner interactive states (map requires API keys)
