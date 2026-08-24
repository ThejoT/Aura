# Aura

A companion app for a low-cost wearable migraine relief headband: two servo-driven
paddles (temple pressure), two 3V vibration motors, and a 5V DC rotation motor,
connected over BLE to an ESP32. Aura closes the control loop, helps a user learn
which modality works for them, and produces a clinically usable headache diary.

**Aura is a wellness device. It does not diagnose or treat migraine.** See the
first-launch screen (`src/screens/FirstLaunchScreen.tsx`) for the full disclaimer
and red-flag symptom guidance shown to every user before first use.

## Design principle

The app is designed for a user who is mid-migraine, photophobic, and has one
working thumb. Pure black backgrounds, dim ember (red-orange) text only, no
white surfaces, no animation, large one-tap targets — enforced app-wide via
`src/theme/`, not just on the Attack Mode screen.

## Stack

- **React Native 0.81** (TypeScript), bootstrapped with the community CLI —
  not Expo, since BLE and background notification scheduling need full native
  module access.
- **react-native-ble-plx** for BLE (`src/ble/`)
- **react-native-sqlite-storage** for local-first storage (`src/db/`) — no
  account, no cloud sync. Health data never leaves the device unless the user
  explicitly exports it (PDF/CSV via the OS share sheet).
- **@notifee/react-native** for local notifications (30-min/2h pain check-ins,
  medication-overuse nudges, the 3-month MIDAS reminder)
- **@react-navigation** (bottom tabs) for the five main screens
- **Open-Meteo** (no API key) for barometric pressure/temperature — the one
  network call in the app, since that's a migraine trigger users can't
  self-report. No health data is ever sent; only coordinates.

## Project layout

```
src/
  theme/          colors, type scale, spacing — the photophobia constraints live here
  components/      shared UI primitives (BigButton, NumberScalePicker, Stepper, ...)
  ble/             BLE protocol + connection service + React hook
  db/              SQLite schema + one repo module per table
  services/        pure domain logic: session engine, insights/correlation math,
                    medication-overuse rule, MIDAS scoring, PDF/CSV export, weather
  state/           SessionContext — the session state machine (start/stop/cooldown)
  screens/         one folder per tab, plus PainCapture/ (baseline + check-in modals)
  navigation/      bottom tab navigator
```

Domain logic (session timing, efficacy math, medication-overuse thresholds,
MIDAS scoring, correlation) is written as plain, dependency-free functions in
`src/services/` specifically so it's unit-testable without mocking React
Native or SQLite.

## BLE protocol

`src/ble/protocol.ts` defines the assumed GATT profile: a custom control
service (device name prefix `AURA-`) with a single 4-byte write
characteristic — `[paddlePwm, vibrationPwm, rotationPwm, flags]` — plus the
standard Bluetooth SIG Battery Service for battery level. **These UUIDs are
placeholders** and must be reconciled with the actual ESP32 firmware's GATT
table before this ships against real hardware; the firmware repo is the
source of truth, not this file.

## Skin-safety / clinical rules encoded in code, not just copy

- `src/services/sessionEngine.ts` — 20-minute hard auto-stop, 10-minute
  mandatory cooldown before restart, both computed from wall-clock timestamps
  (not a naive counter) so backgrounding or killing the app can't be used to
  bypass them.
- `src/services/medicationOveruseEngine.ts` — flags triptan/combination-analgesic
  use on >10 days, or simple-analgesic use on >15 days, in a rolling 30-day
  window (the clinical definition behind medication overuse headache).
- `src/services/insightsEngine.ts` — never states a per-modality efficacy
  recommendation until that mode/placement pair has 10+ sessions with a valid
  baseline → 2-hour rating pair.
- `src/services/correlationEngine.ts` — the Diary's pattern view stays locked
  until 60 days of data exist, and is always labeled "association, not
  causation."

## Development

```sh
npm install
npm run ios       # or npm run android — requires Xcode/Android Studio + a device/simulator
npm test
npm run lint
```

`npm test` and `npx tsc --noEmit` and `npx eslint . --ext .ts,.tsx` all pass
as of this commit — verified in this environment. The dependency-free logic
in `src/services/__tests__/` and `src/ble/__tests__/` (session timing,
efficacy math, medication-overuse thresholds, correlation, MIDAS scoring,
BLE command encoding) has real unit test coverage and is runtime-verified —
47 tests passing. **The app itself has not been run on a simulator,
emulator, or device** — this sandbox has no iOS/Android runtime, so
build/runtime correctness on an actual device is unverified beyond that,
plus static typechecking, linting, and the mocked-native-modules Jest smoke
test in `jest.setup.js` for the UI/native-integration layers. Before
shipping: run on both platforms, pair with real (or mocked) ESP32 firmware,
and confirm the BLE UUIDs in `src/ble/protocol.ts` against the firmware's
actual GATT table.

## Permissions

Declared in `android/app/src/main/AndroidManifest.xml` and
`ios/Aura/Info.plist`: Bluetooth scan/connect, coarse location (BLE scanning
on Android <12, and the Diary's weather auto-pull), and notifications.
