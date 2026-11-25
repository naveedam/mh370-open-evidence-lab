/**
 * Evidence classification — every datum shown in the platform carries one of these.
 * verified_observation    : directly measured / physically confirmed (e.g. recovered debris identified as 9M-MRO)
 * published_interpretation: an official or peer-reviewed analytical result (e.g. the 7th arc)
 * reconstructed_scenario  : our reproduction of a published method, or an illustrative scenario
 * experimental_model      : output of this platform's own models (Track B)
 * pending                 : slot defined, data not yet ingested
 */
export type EvidenceClass =
  | 'verified_observation'
  | 'published_interpretation'
  | 'reconstructed_scenario'
  | 'experimental_model'
  | 'pending'

export interface Provenance {
  source: string
  sourceUrl?: string
  publicationDate?: string
  /** Positional accuracy statement in plain words, e.g. "locality-level, ~5 km" */
  spatialAccuracy: string
  methodology: string
  /** Statistical / evidential confidence — distinct from spatial accuracy */
  confidence: 'high' | 'medium' | 'low' | 'unassessed'
  verificationNote?: string
}

export interface FeatureProps extends Provenance {
  id: string
  name: string
  date?: string
  description: string
  evidenceClass: EvidenceClass
  coverageClass?: string | null
}

export type LayerGroup = 'Flight information' | 'Historical underwater searches' | 'Oceanography' | 'Research layers'

export interface LayerDef {
  id: string
  group: LayerGroup
  name: string
  kind: 'geojson' | 'raster'
  geometry?: 'point' | 'line' | 'polygon'
  evidenceClass: EvidenceClass
  defaultVisible: boolean
  data?: GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps>
  /** Raster tile template (for reference basemap overlays) */
  tiles?: string[]
  attribution?: string
  /** When no data is loaded: what is required and from where */
  pending?: { reason: string; requiredSource: string; sourceUrl?: string }
}

export interface DatasetRecord {
  id: string
  name: string
  organisation: string
  url: string
  publicationDate: string | null
  acquisitionDate: string | null
  coverage: string
  format: string
  licensing: string
  quality: string
  processingHistory: string[]
  access: 'open-download' | 'open-viewer-only' | 'reports-only' | 'restricted' | 'unverified'
  ingestionStatus: 'ingested' | 'catalogued' | 'pending-review'
  /** Geoscience Australia eCat record — download links are resolved from it at ingestion time */
  ecatUuid?: string
  tags: string[]
}

export interface Hypothesis {
  id: string
  title: string
  description: string
  supportingEvidence: string[]
  contradictingEvidence: string[]
  assumptions: string[]
  confidence: 'unassessed' | 'low' | 'medium' | 'high'
  dataDependencies: string[]
  modelOutputs: string[]
  status: 'proposed' | 'under-evaluation' | 'supported' | 'weakened' | 'rejected'
  origin: 'published' | 'independent'
}
