import type { StyleSpecification } from 'maplibre-gl'

const raster = (id: string, tiles: string[], attribution: string, maxzoom = 19): StyleSpecification => ({
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: { [id]: { type: 'raster', tiles, tileSize: 256, attribution, maxzoom } },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#07090c' } },
    { id, type: 'raster', source: id },
  ],
})

/** Free, keyless basemaps. Check each provider's usage policy before heavy production traffic. */
export const BASEMAPS = {
  dark: {
    label: 'Dark',
    // Esri Dark Gray Canvas — keyless. (CARTO basemaps now require an API key.)
    style: raster('esri-dark', ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'], 'Esri, HERE, Garmin, © OpenStreetMap contributors', 16),
  },
  ocean: {
    label: 'Ocean',
    style: raster('esri-ocean', ['https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'], 'Esri, GEBCO, NOAA, Garmin and other contributors', 13),
  },
  osm: {
    label: 'OSM',
    style: raster('osm', ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], '© OpenStreetMap contributors'),
  },
} as const

export type BasemapKey = keyof typeof BASEMAPS
