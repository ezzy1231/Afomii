# Dev Environment Requirements & Autonomous Build Loop

> Goal: an environment where the agent can **build, see, test and iterate on the app by itself** until each task meets its spec DoD — with the human only reviewing milestones.

---

## 1. Current machine status (probed)

| Requirement | Status on this PC |
|---|---|
| Node.js ≥ 18 | ✅ v26.7.0 (+ npm 11.12.1) |
| Git | ✅ 2.51.1 |
| Docker Engine (pg+PostGIS, redis) | ⚠️ CLI 28.5.1 installed — **daemon not running** |
| JDK 17 (Android tooling) | ❌ missing |
| Android SDK + platform-tools (adb) | ❌ missing |
| Emulator + system image + AVD | ❌ missing |
| Expo Go on emulator | ❌ pending (auto-installable once emulator exists) |
| Hardware | ✅ 32 logical CPUs — emulation will be fast |

## 2. What you need to install (one-time, ~30 min mostly downloads)

> **Automated path (preferred):** everything in §2 is scripted — `scripts/setup-machine.ps1`.
> Run it once from the repo root; it is idempotent, logs to `logs/machine-setup.log`, and
> handles winget failures with direct-download fallbacks (Adoptium ZIP for JDK, Google's
> cmdline-tools ZIP for the SDK). Android Studio itself is **optional** for the build loop —
> the headless SDK installed in §2.3-style steps provides adb/emulator/sdkmanager/avdmanager;
> install Studio later only if you want a GUI IDE.
> Verify afterwards with `scripts/dev-env-check.ps1` (it resolves tools via ANDROID_HOME, so a stale terminal PATH doesn't matter).

### 2.1 Start Docker Desktop (already installed)

```powershell
Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
# wait ~60s, then verify:
docker info --format {{.ServerVersion}}
```

> If Docker Desktop is *not* actually installed: `winget install Docker.DockerDesktop`, reboot if prompted (WSL2). Personal use is free.

### 2.2 JDK 17 (Temurin)

```powershell
winget install EclipseAdoptium.Temurin.17.JDK
# set system env var (new shells):
[Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.*', 'Machine')  # adjust to actual dir
```

### 2.3 Android Studio + SDK components (installs sdkmanager/emulator/adb)

```powershell
winget install Google.AndroidStudio   # ~1.5 GB; open once, skip wizard defaults are fine
```

Then SDK components (`sdkmanager` lives under `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin`):

```powershell
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "emulator" "system-images;android-35;google_apis;x86_64"
```

Environment variables (set once, Machine scope):

```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'Machine')
# append to PATH: %LOCALAPPDATA%\Android\Sdk\platform-tools and ...\emulator
```

**Virtualization**: enable *Windows Hypervisor Platform* (Optional Features) and BIOS VT-x if emulator fails to boot — first boot error message makes this obvious.

### 2.4 Create the test device (AVD)

```powershell
avdmanager create avd -n FoodRidePixel7 -k "system-images;android-35;google_apis;x86_64" -d pixel_7
emulator -avd FoodRidePixel7   # first boot takes a few minutes
```

`google_apis` image (not Play Store) is deliberate: faster boots, sideloading allowed, no Google account needed.

### 2.5 Expo Go on the emulator — automatic

No manual download needed: when Metro runs, pressing **a** (or the agent issuing `adb shell am start ... exp://`) makes Expo CLI offer to install Expo Go automatically; fallback is sideloading the universal APK from <https://expo.dev/go> via `adb install`.

### 2.6 Later phases (not blockers today)

| Tool | Needed for | Install |
|---|---|---|
| Maestro | QA-1 E2E flows | official Windows installer (GitHub releases) at M4 |
| EAS CLI (`npm i -g eas-cli`) + Expo account | INF-2 dev clients, OTA, store builds | at M5 |
| Physical iPhone + Expo Go | iOS visual spot-checks (no iOS simulator exists on Windows) | your phone, same Wi-Fi/tunnel |

### 2.7 Disk & RAM budget

~15 GB free for SDK+emulator images; emulator happy with 4 GB RAM allocation (machine has plenty).

---

## 3. Environment readiness gate

`scripts/dev-env-check.ps1` prints a PASS/FAIL table for everything above. The build loop starts **only when every row passes** — run it after installing.

## 4. How the autonomous loop works (what the agent does, unattended)

### 4.1 Session bootstrap (per work session)

1. Background job A: `docker compose up -d` → poll `docker compose ps` healthy.
2. Background job B: backend `npm run start:dev` → poll `GET :4000/api/v1/health`.
3. Background job C: Android emulator `-avd FoodRidePixel7` → wait `adb wait-for-device` + boot completed.
4. Background job D: `npx expo start` (Metro) → wait for bundle banner.
5. One-time per session: seed demo data (`db:seed` from BE-0.6).

All four are tracked background jobs — started once, kept alive, killed cleanly at session end.

### 4.2 The inner verification loop (repeats per screen/feature/task)

```
┌─ write/change code ───────────────────────────────────────────────────┐
│                                                                       │
│  Metro hot-reloads the running app automatically (no reinstall)       │
│                                                                       │
│  SEE:   adb exec-out screencap -p > shot.png  → agent reads the PNG   │
│         (light+dark, empty+loaded states)                             │
│                                                                       │
│  DRIVE: adb deep-links straight into any route, e.g.                  │
│         am start -a android.intent.action.VIEW -d foodride:///event/X │
│                                                                       │
│  FUNCTIONALITY:                                                       │
│    • backend: jest unit + supertest integration against live pg/redis │
│    • mobile: jest unit/component                                      │
│    • end-to-end: Maestro flows tap through real UI (M4+)              │
│    • logs: adb logcat ReactNativeJS + API console tailed for errors   │
│                                                                       │
│  JUDGE: screenshot + test results vs the task's DoD row in            │
│         docs/plan/*.md  → mismatch? back to top of loop               │
│                                                                       │
└─ exit when: visual spec met AND tests green AND no error logs ───────┘
```

**Networking shortcut:** the emulator reaches the host API at `http://10.0.2.2:4000/api/v1` — no LAN IP or firewall involvement for automated runs. (`EXPO_PUBLIC_API_URL` differs between emulator runs and physical-phone runs; both documented in `.env.local.example`.)

### 4.3 Definition of "done looping"

- **Task level**: its DoD row demonstrated (screenshot evidence saved under `docs/evidence/<task-id>/` + tests green).
- **Milestone level**: the demo script in `03-delivery-and-release.md` §8 performed end-to-end without manual fixes.

## 5. Division of labor

| Who | Does what |
|---|---|
| You (once) | Install §2 items, approve sandbox escalations if prompted, keep Docker Desktop signed in |
| Agent | Everything else: infra up/down, coding, driving emulator, screenshots, tests, iterating to DoD, milestone reports with evidence folders |
| Your iPhone (optional) | 2-minute visual sanity of each milestone via Expo Go QR — Android coverage is fully automated |

## 6. Known constraints (stated honestly)

- No iOS simulator exists on Windows → iOS UI is verified by parity reasoning + your physical device checks; release-grade iOS verification arrives with EAS builds/TestFlight (M5).
- Expo Go cannot load remote-push or custom native modules → those tasks (BE-5/FE-7 push UX, payments sheet) are coded and logic-tested now, visually verified at M5 when dev-client builds exist.
- Node 26 is bleeding-edge; if Metro/tooling misbehaves the documented fallback is Node 22 LTS via nvm-windows.