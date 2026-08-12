# GPS Explorer

A gamified GPS exploration prototype built with Vue 3 (`<script setup>`, TypeScript, Vite) and
MapLibre GL, wrapped with Capacitor to run natively on Android with real device GPS.

This is an early-stage prototype: it currently renders a map and tracks/marks your live
position. It uses the public `demotiles.maplibre.org` MapLibre style (swap for AWS Location
Service in production) and has no authentication or backend yet.

## Prerequisites

- Node.js (LTS) and npm
- [Android Studio](https://developer.android.com/studio) with an installed JDK (Android Studio
  bundles a compatible JDK by default)
- A physical Android phone with **Developer Options** and **USB debugging** enabled, connected
  via USB (or an Android emulator with location support, though a real device is recommended
  for testing GPS)

## Run in the browser (web dev)

```bash
npm install
npm run dev
```

Opens the app in your default browser. Geolocation falls back to the standard
`navigator.geolocation` browser API — useful for quick UI iteration, but browser-based
location is less accurate/reliable than the native GPS used on a real device.

## Run on a physical Android phone

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the web assets and sync them into the native Android project:
   ```bash
   npm run cap:sync
   ```
3. Open the Android project in Android Studio:
   ```bash
   npm run cap:open:android
   ```
4. Connect your phone via USB. Once it appears as a run target in Android Studio, select it and
   click **Run**.
5. On first launch, grant the location permission prompt so the app can access GPS.

You should see the map center on your live location, with the marker updating as you move.

Whenever you make frontend changes, re-run `npm run cap:sync` before re-running the app in
Android Studio so the native project picks up the latest build.

## Project structure

- `src/components/LiveMap.vue` — renders the MapLibre map and live position marker
- `capacitor.config.ts` — Capacitor native shell configuration
- `android/` — generated native Android project (do not hand-edit generated files; re-run
  `cap sync` instead)
