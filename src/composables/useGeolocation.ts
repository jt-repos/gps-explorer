import { ref, onBeforeUnmount, type Ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export interface LngLat {
  lng: number
  lat: number
}

export function useGeolocation() {
  const position: Ref<LngLat | null> = ref(null)
  const error: Ref<string | null> = ref(null)

  let nativeWatchId: string | null = null
  let webWatchId: number | null = null

  function handlePosition(coords: { longitude: number; latitude: number }) {
    position.value = { lng: coords.longitude, lat: coords.latitude }
  }

  async function start() {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        error.value = 'Location permission denied'
        return
      }

      // Warm start: grab a quick, possibly cached/low-accuracy fix so the map
      // isn't stuck waiting on a slow high-accuracy GPS lock.
      try {
        const quick = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000
        })
        handlePosition(quick.coords)
      } catch {
        // ignore - watchPosition below will keep trying
      }

      nativeWatchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 15000 },
        (pos, err) => {
          if (err) {
            // Don't clobber an existing fix with a transient timeout error
            if (!position.value) error.value = err.message
            return
          }
          error.value = null
          if (pos) handlePosition(pos.coords)
        }
      )
    } else {
      if (!('geolocation' in navigator)) {
        error.value = 'Geolocation not supported'
        return
      }
      webWatchId = navigator.geolocation.watchPosition(
        (pos) => { error.value = null; handlePosition(pos.coords) },
        (err) => { if (!position.value) error.value = err.message },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 }
      )
    }
  }

  function stop() {
    if (nativeWatchId) {
      Geolocation.clearWatch({ id: nativeWatchId })
      nativeWatchId = null
    }
    if (webWatchId !== null) {
      navigator.geolocation.clearWatch(webWatchId)
      webWatchId = null
    }
  }

  onBeforeUnmount(stop)

  return { position, error, start, stop }
}