# Delivery Process, CI/CD & Release — FoodRide Mobile

> How the work in `01-backend-spec.md` and `02-mobile-spec.md` is executed, verified and shipped.

---

## 1. Engineering workflow

- **Trunk-based**: short-lived branches off `main`; PR within 1–2 days of work; squash-merge.
- **Branch naming**: `<type>/<task-id>-<slug>` → `feat/FE-301-slot-grid`, `fix/BE-24-branch-geo`, `chore/INF-1-scaffold`.
- **Commits**: Conventional Commits (`feat(reservations): per-slot availability`); task ID in body.
- **PR template checklist**: tests added/updated · contracts updated (if API) · screenshots/screen-recording (if UI) · no new `any` · i18n keys used · DoD met.
- **Reviews**: 1 approval; backend contract changes also need the mobile caller to ack (comment) — keeps the shared-contract promise honest.

## 2. Definition of Done (global)

A task is done when: code merged · automated tests written and green in CI · acceptance criteria from its spec row demonstrated locally · no new lint/type violations · for UI: verified on Android emulator **and** an iOS device/simulator via Expo Go · docs touched if behavior changed.

---

## 3. CI/CD (GitHub Actions)

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | every PR | job `backend`: install → lint → test (jest + supertest against docker-compose services) · job `mobile`: install → `tsc --noEmit` → eslint → jest unit · job `shared`: build + test |
| `e2e-nightly.yml` | schedule nightly | boot seeded stack → backend e2e smoke → Maestro suite on Android emulator |
| `release.yml` | tag `v*` or manual dispatch | `eas build --profile production --platform all` → `eas submit` (staging channels first) |

Sketch:

```yaml
# .github/workflows/ci.yml (excerpt)
jobs:
  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint --workspace=@urbanexplore/mobile
      - run: npx tsc --noEmit -p apps/mobile
      - run: npm test --workspace=@urbanexplore/mobile
```

---

## 4. Environments & secrets matrix

| Variable | Local dev | EAS preview | EAS production | Owner |
|---|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | LAN IP :4000/api/v1 | staging API URL | prod API URL | eas.json env / secrets |
| `DATABASE_URL` | compose foodride/foodride_dev | staging secret | prod secret | backend only |
| `REDIS_URL` | localhost:6379 | staging | prod | backend only |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | local .env | EAS/infra secrets | infra secrets | backend only |
| Google Maps API key (Android) | n/a (Expo Go default) | EAS secret → manifest | EAS secret | never committed |
| Stripe keys | test mode | test mode | live mode | BE-6 gate |

`apps/mobile/eas.json` profiles:

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "env": { "EXPO_PUBLIC_API_URL": "https://staging-api.foodride.app/api/v1" } },
    "preview":     { "distribution": "internal", "channel": "preview" },
    "production":  { "channel": "production", "autoIncrement": true }
  },
  "submit": {
    "production": { "android": { "track": "internal", "releaseStatus": "draft" }, "ios": { "appleId": "...", "ascAppId": "..." } }
  }
}
```

Runtime version policy: use `"runtimeVersion": { "policy": "appVersion" }` so EAS Update can hot-patch JS between native releases.

---

## 5. Testing strategy summary (both sides)

| Layer | Backend | Mobile |
|---|---|---|
| Unit | service logic, 80% floor on changed files | lib/, stores, refresh queue |
| Integration | controllers + real pg/redis via compose test profile; ownership isolation + concurrency races | component tests (RTL) on critical primitives |
| Contract | pinned response shapes (auth envelope, pagination, error codes) | client normalizer tested against the same fixtures (copy them into `packages/shared/fixtures` so both suites consume one file) |
| E2E | jest-e2e happy paths | Maestro: auth, book-table, buy-ticket (+forced hold expiry), ride-dispatch |
| Manual | — | Expo Go on physical Android + iOS before each milestone demo |

---

## 6. Observability

- **Sentry** both sides: mobile (`sentry-expo`) w/ release tags = version + runtimeVersion; backend Nest capture filter excluding 4xx noise.
- KPIs reviewed weekly during M0–M5: crash-free sessions ≥ 99% · API p95 < 300ms (reads) · hold-checkout success rate · auth refresh failure rate.
- Alerting: Sentry alert on new issue spike; health endpoint uptime monitor (BE-0.4) on staging/prod.

---

## 7. Store launch checklist (REL-1)

**Accounts & legal**
- [ ] Apple Developer Program + Google Play Console org accounts (start early — verification takes days).
- [ ] Privacy Policy + Terms URLs live (reuse web `/privacy`, `/terms`).

**Assets**
- [ ] App icon 1024², adaptive icon foreground/background, splash.
- [ ] Screenshots: iPhone 6.9" + iPad 13" sets, Pixel set — capture from polished M4 build.
- [ ] Feature copy: title 30 chars, subtitle, keywords, descriptions (en + Q3 languages).

**Compliance**
- [ ] Apple privacy nutrition labels: location (app functionality), identifiers (analytics), sensitive: dietary/allergy prefs — declare as data linked to identity, encrypted in transit.
- [ ] Play Data safety form mirrors the same declarations.
- [ ] Location permission purpose strings (iOS Info.plist via config plugin) match §7.4 copy of the mobile spec.
- [ ] If payments shipped (BE-6): note exemption basis (physical-world event tickets) in App Review notes.

**Rollout**
- [ ] TestFlight internal → external groups; Play internal → closed testing.
- [ ] Phased production release 10% → 50% → 100% with Sentry crash-free gate at each step.
- [ ] Rollback plan: native rollback = store re-release of last good build; JS-only regressions hot-patched via EAS Update channel repoint.

---

## 8. Milestone → epic traceability

| Milestone | Epics included | Demo script (Expo Go) |
|---|---|---|
| M0 | INF-1, BE-0, FE-1 | Scan QR → themed tabs; seeded restaurants visible via API health screen |
| M1 | FE-2 (+BE-0.5) | Sign up on phone, kill app, reopen signed-in; edit preferences |
| M2 | BE-1, BE-2, FE-3 | Book table end-to-end; see it appear in web partner dashboard; cancel it |
| M3 | BE-3, FE-4 | Two phones race for last VIP ticket; winner sees QR wallet |
| M4 | BE-4, FE-5, FE-6, QA-1 | Ride estimates → dispatch handoff; offline airplane-mode graceful start; nightly Maestro green |
| M5 | INF-2, BE-5, FE-7, REL-1 | Push received on both platforms; TestFlight + Play internal builds installed |

Effort model: 1 senior dev ≈ 10 weeks to M5; parallelizing a second developer across BE/FE tracks compresses to ~6–7 weeks (the epic dependency table in master plan §5 shows safe splits).