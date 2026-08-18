<template>
  <div ref="mapContainer" class="map-container"></div>
  <p v-if="error" class="error">{{ error }}</p>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useGeolocation } from '../composables/useGeolocation'

const mapContainer = ref<HTMLDivElement | null>(null)
const { position, error, start } = useGeolocation()

let map: maplibregl.Map | undefined
let marker: maplibregl.Marker | undefined

onMounted(() => {
  if (!mapContainer.value) return

  map = new maplibregl.Map({
    container: mapContainer.value,
    // DEV BRIDGE ONLY: a raster (PNG) basemap.
    // The demotiles *vector* style renders blank on the Capacitor/Android
    // WebView because MapLibre parses vector (.pbf) tiles in a Web Worker
    // that never completes there. Raster tiles decode on the main thread and
    // render reliably. OpenStreetMap's public tile server is not licensed for
    // real app traffic, so replace this with the AWS Location Service style
    // before shipping.
    style: {
      version: 8,
      sources: {
        'raster-osm': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'raster-osm', type: 'raster', source: 'raster-osm' }],
    },
    center: [0, 0],
    zoom: 2,
  })

  start()
})

watch(position, (pos) => {
  if (!pos || !map) return
  const lngLat: [number, number] = [pos.lng, pos.lat]
  if (!marker) {
    marker = new maplibregl.Marker({ color: '#e63946' }).setLngLat(lngLat).addTo(map)
    map.jumpTo({ center: lngLat, zoom: 15 })
  } else {
    marker.setLngLat(lngLat)
    map.easeTo({ center: lngLat })
  }
})

onBeforeUnmount(() => {
  map?.remove()
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
}
.error {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: red;
  background: white;
  padding: 0.5rem;
}
</style>
