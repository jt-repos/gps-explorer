import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geoquest.app',
  appName: 'GeoQuest',
  webDir: 'dist',
  // MapLibre GL fetches vector tiles as binary arraybuffers. Capacitor's
  // native CapacitorHttp bridge intercepts fetch/XHR and mangles binary
  // responses, causing tiles to silently fail to load (grey map) on
  // Android/iOS while working fine in a regular browser. Disable it so
  // fetch/XHR go through the WebView's normal network stack.
  plugins: {
    CapacitorHttp: {
      enabled: false
    }
  }
};

export default config;
