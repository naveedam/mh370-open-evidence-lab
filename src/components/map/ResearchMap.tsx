import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { Crosshair, Download, Layers, Ruler, X } from 'lucide-react'
import { useData } from '@/lib/data'
import type { LayerDef } from '@/types/evidence'
import { BASEMAPS, type BasemapKey } from './basemaps'
import { CLASS_COLORS } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, downloadJson, fmtCoord, haversineKm } from '@/lib/utils'
import type { FeatureProps } from '@/types/evidence'

interface Props {
  visible: Set<string>
  onSelect?: (f: FeatureProps | null) => void
  selectedId?: string | null
  compact?: boolean
  className?: string
}

// MapLibre v6 ships an ES-module worker; let Vite bundle it and point MapLibre at it.
maplibregl.setWorkerUrl(workerUrl)

const INITIAL_CENTER: [number, number] = [76, -14]
const INITIAL_ZOOM = 2.4

function addDataLayers(map: MLMap, LAYERS: LayerDef[]) {
  for (const def of LAYERS) {
    if (map.getSource(def.id)) continue
    if (def.kind === 'raster' && def.tiles) {
      map.addSource(def.id, { type: 'raster', tiles: def.tiles, tileSize: 256, attribution: def.attribution })
      map.addLayer({ id: def.id, type: 'raster', source: def.id, paint: { 'raster-opacity': 0.75 }, layout: { visibility: 'none' } })
      continue
    }
    if (!def.data) continue
    map.addSource(def.id, { type: 'geojson', data: def.data, promoteId: 'id' })
    const color = CLASS_COLORS[def.evidenceClass]
    if (def.geometry === 'point') {
      map.addLayer({
        id: `${def.id}-halo`, type: 'circle', source: def.id, layout: { visibility: 'none' },
        paint: { 'circle-radius': ['case', ['boolean', ['feature-state', 'selected'], false], 16, 11], 'circle-color': color, 'circle-opacity': 0.15, 'circle-stroke-color': color, 'circle-stroke-opacity': 0.5, 'circle-stroke-width': 1 },
      })
      map.addLayer({
        id: def.id, type: 'circle', source: def.id, layout: { visibility: 'none' },
        paint: { 'circle-radius': 4.5, 'circle-color': color, 'circle-stroke-color': '#07090c', 'circle-stroke-width': 1.5 },
      })
    } else if (def.geometry === 'line') {
      map.addLayer({ id: def.id, type: 'line', source: def.id, layout: { visibility: 'none' }, paint: { 'line-color': color, 'line-width': 1.5, 'line-dasharray': [3, 2] } })
    } else {
      map.addLayer({ id: def.id, type: 'fill', source: def.id, layout: { visibility: 'none' }, paint: { 'fill-color': color, 'fill-opacity': 0.12, 'fill-outline-color': color } })
    }
  }
  if (!map.getSource('measure')) {
    map.addSource('measure', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({ id: 'measure-line', type: 'line', source: 'measure', filter: ['==', '$type', 'LineString'], paint: { 'line-color': '#f2f2f2', 'line-width': 1.5, 'line-dasharray': [2, 2] } })
    map.addLayer({ id: 'measure-pts', type: 'circle', source: 'measure', filter: ['==', '$type', 'Point'], paint: { 'circle-radius': 3.5, 'circle-color': '#f2f2f2' } })
  }
}

const interactiveIds = (LAYERS: LayerDef[]) => LAYERS.filter((l) => l.kind === 'geojson' && l.data).map((l) => l.id)

export function ResearchMap({ visible, onSelect, selectedId, compact, className }: Props) {
  const { layers: LAYERS } = useData()
  const layersRef = useRef(LAYERS)
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const visibleRef = useRef(visible)
  const measureRef = useRef<[number, number][]>([])
  const measuringRef = useRef(false)
  const selectedRef = useRef<string | null>(null)
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  const [basemap, setBasemap] = useState<BasemapKey>('dark')
  const [cursor, setCursor] = useState<[number, number] | null>(null)
  const [measuring, setMeasuring] = useState(false)
  const [measureKm, setMeasureKm] = useState(0)
  const [ready, setReady] = useState(false)

  const applyVisibility = (map: MLMap) => {
    for (const def of layersRef.current) {
      const v = visibleRef.current.has(def.id) ? 'visible' : 'none'
      for (const id of [def.id, `${def.id}-halo`]) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
    }
  }

  const redrawMeasure = (map: MLMap) => {
    const pts = measureRef.current
    const src = map.getSource('measure') as GeoJSONSource | undefined
    if (!src) return
    const features: GeoJSON.Feature[] = pts.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} }))
    if (pts.length > 1) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: pts }, properties: {} })
    src.setData({ type: 'FeatureCollection', features })
    let km = 0
    for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i])
    setMeasureKm(km)
  }

  useEffect(() => {
    if (!ref.current) return
    const map = new maplibregl.Map({
      container: ref.current,
      style: BASEMAPS.dark.style,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
      renderWorldCopies: false,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    map.on('style.load', () => {
      addDataLayers(map, layersRef.current)
      applyVisibility(map)
      redrawMeasure(map)
      setReady(true)
    })
    map.on('mousemove', (e) => setCursor([e.lngLat.lng, e.lngLat.lat]))
    map.on('mouseout', () => setCursor(null))
    map.on('click', (e) => {
      if (measuringRef.current) {
        measureRef.current = [...measureRef.current, [e.lngLat.lng, e.lngLat.lat]]
        redrawMeasure(map)
        return
      }
      const layers = interactiveIds(layersRef.current).filter((id) => map.getLayer(id) && visibleRef.current.has(id))
      const hits = layers.length ? map.queryRenderedFeatures(e.point, { layers }) : []
      const hit = hits[0]
      onSelectRef.current?.(hit ? (hit.properties as unknown as FeatureProps) : null)
    })
    map.on('mousemove', (e) => {
      if (measuringRef.current) return (map.getCanvas().style.cursor = 'crosshair'), undefined
      const layers = interactiveIds(layersRef.current).filter((id) => map.getLayer(id) && visibleRef.current.has(id))
      const n = layers.length ? map.queryRenderedFeatures(e.point, { layers }).length : 0
      map.getCanvas().style.cursor = n ? 'pointer' : ''
    })
    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    visibleRef.current = visible
    if (mapRef.current && ready) applyVisibility(mapRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const setState = (fid: string | null, selected: boolean) => {
      if (!fid) return
      const def = layersRef.current.find((l) => l.data?.features.some((f) => f.properties.id === fid))
      if (def) map.setFeatureState({ source: def.id, id: fid }, { selected })
    }
    setState(selectedRef.current, false)
    setState(selectedId ?? null, true)
    selectedRef.current = selectedId ?? null
  }, [selectedId, ready])

  useEffect(() => {
    layersRef.current = LAYERS
    const map = mapRef.current
    if (!map || !ready) return
    for (const l of LAYERS) {
      const src = map.getSource(l.id) as GeoJSONSource | undefined
      if (l.data && src && 'setData' in src) src.setData(l.data)
    }
    addDataLayers(map, LAYERS)
    applyVisibility(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LAYERS, ready])

  useEffect(() => {
    measuringRef.current = measuring
  }, [measuring])

  const switchBasemap = (k: BasemapKey) => {
    setBasemap(k)
    setReady(false)
    mapRef.current?.setStyle(BASEMAPS[k].style)
  }

  const clearMeasure = () => {
    measureRef.current = []
    if (mapRef.current) redrawMeasure(mapRef.current)
  }

  const exportVisible = () => {
    const features = LAYERS.filter((l) => visible.has(l.id) && l.data).flatMap((l) =>
      l.data!.features.map((f) => ({ ...f, properties: { ...f.properties, layer: l.id } })),
    )
    downloadJson(`mh370-oel-features-${new Date().toISOString().slice(0, 10)}.geojson`, {
      type: 'FeatureCollection',
      metadata: { exportedBy: 'MH370 Open Evidence Lab v0.1', exportedAt: new Date().toISOString(), note: 'Each feature retains its provenance properties.' },
      features,
    })
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <div ref={ref} className="absolute inset-0" />
      {!compact && (
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md border border-ink-600 bg-ink-900/90 p-1 backdrop-blur">
          <Layers className="mx-1 h-3.5 w-3.5 text-slate-500" />
          {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
            <Button key={k} size="sm" variant={basemap === k ? 'active' : 'ghost'} onClick={() => switchBasemap(k)}>
              {BASEMAPS[k].label}
            </Button>
          ))}
          <div className="mx-1 h-4 w-px bg-ink-600" />
          <Button size="sm" variant={measuring ? 'default' : 'ghost'} onClick={() => { setMeasuring((m) => !m); if (measuring) clearMeasure() }} title="Measure great-circle distance">
            <Ruler className="h-3.5 w-3.5" /> Measure
          </Button>
          <Button size="sm" variant="ghost" onClick={exportVisible} title="Export visible features as GeoJSON">
            <Download className="h-3.5 w-3.5" /> GeoJSON
          </Button>
        </div>
      )}
      {measuring && (
        <div className="absolute left-3 top-14 flex items-center gap-3 rounded-md border border-ink-600 bg-ink-900/95 px-3 py-2 text-xs">
          <span className="label">Great-circle</span>
          <span className="mono text-slate-100">{measureKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</span>
          <span className="mono text-slate-500">{(measureKm / 1.852).toLocaleString(undefined, { maximumFractionDigits: 1 })} NM</span>
          <button onClick={clearMeasure} className="text-slate-500 hover:text-slate-200" title="Clear"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 rounded border border-ink-600 bg-ink-900/90 px-2 py-1 mono text-[11px] text-slate-400" style={{ marginBottom: compact ? 0 : 18 }}>
        <Crosshair className="h-3 w-3" />
        {cursor ? fmtCoord(cursor[0], cursor[1]) : '—'}
      </div>
    </div>
  )
}
