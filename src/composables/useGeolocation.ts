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

      nativeWatchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (pos, err) => {
          if (err) {
            error.value = err.message
            return
          }
          if (pos) handlePosition(pos.coords)
        }
      )
    } else {
      if (!('geolocation' in navigator)) {
        error.value = 'Geolocation not supported'
        return
      }
      webWatchId = navigator.geolocation.watchPosition(
        (pos) => handlePosition(pos.coords),
        (err) => { error.value = err.message },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
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