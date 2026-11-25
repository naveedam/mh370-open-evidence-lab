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
    style: raster('carto-dark', ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', 'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'], '© OpenStreetMap contributors © CARTO'),
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
