import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { LAYERS } from '@/data/layers'
import { DATASETS } from '@/data/datasets'
import { SEED_HYPOTHESES } from '@/data/hypotheses'
import type { DatasetRecord, FeatureProps, Hypothesis, LayerDef } from '@/types/evidence'

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

export type BackendStatus = 'connecting' | 'postgres' | 'offline-seed'
export interface CoverageRow { class: 'confirmed_searched' | 'partially_surveyed' | 'insufficient_resolution' | 'unknown'; areaKm2: number; surveys: number }
interface DataState { status: BackendStatus; postgis?: string; layers: LayerDef[]; datasets: DatasetRecord[]; hypotheses: Hypothesis[]; coverage: CoverageRow[] }

const initial: DataState = { status: 'connecting', layers: LAYERS, datasets: DATASETS, hypotheses: SEED_HYPOTHESES, coverage: [] }
const Ctx = createContext<DataState>(initial)

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(5000) })
  if (!r.ok) throw new Error(`${path}: ${r.status}`)
  return r.json() as Promise<T>
}

/**
 * Loads research data from the Postgres-backed API. If the API is unreachable the app keeps the
 * bundled seed (same records, same provenance) and the status bar says so.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(initial)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const health = await get<{ postgis: string }>('/health')
        const [fc, datasets, hypotheses, coverage] = await Promise.all([
          get<GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps & { layer: string }>>('/features'),
          get<DatasetRecord[]>('/datasets'),
          get<Hypothesis[]>('/hypotheses'),
          get<CoverageRow[]>('/coverage').catch(() => [] as CoverageRow[]),
        ])
        const layers = LAYERS.map((l) => {
          if (l.kind !== 'geojson') return l
          const features = fc.features.filter((f) => f.properties.layer === l.id)
          if (!features.length) return l
          // A previously pending layer takes the evidence class of its ingested features.
          const evidenceClass = l.evidenceClass === 'pending' ? features[0].properties.evidenceClass : l.evidenceClass
          return { ...l, evidenceClass, data: { type: 'FeatureCollection' as const, features } }
        })
        if (!cancelled) setState({ status: 'postgres', postgis: health.postgis, layers, datasets, hypotheses, coverage })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: 'offline-seed' }))
      }
    })()
    return () => { cancelled = true }
  }, [])
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(Ctx)
