<template>
  <div ref="mapContainer" class="map-container"></div>
  <p v-if="error" class="error">{{ error }}</p>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'
import { useGeolocation } from '../composables/useGeolocation'
import { watch } from 'vue'

const mapContainer = ref(null)
const { position, error, start } = useGeolocation()
let map, marker

onMounted(() => {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 0],
    zoom: 2
  })

  start()
})


watch(position, (pos) => {
  if (!pos) return
  const lngLat = [pos.lng, pos.lat]
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
.map-container { width: 100%; height: 100vh; }
.error { position: absolute; top: 1rem; left: 1rem; color: red; background: white; padding: .5rem; }
</style>