import type { FeatureProps, LayerDef } from '../types/evidence.ts'

const fc = (features: GeoJSON.Feature<GeoJSON.Geometry, FeatureProps>[]) =>
  ({ type: 'FeatureCollection', features }) as GeoJSON.FeatureCollection<GeoJSON.Geometry, FeatureProps>

const pt = (lng: number, lat: number, p: FeatureProps): GeoJSON.Feature<GeoJSON.Point, FeatureProps> => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lng, lat] },
  properties: p,
})

const ATSB_FINAL = 'https://www.atsb.gov.au/mh370-operational-search-reports'

/**
 * SEED POLICY: only features whose location is a matter of public geographic record are bundled.
 * Every coordinate below is flagged with its accuracy and a verification note. Search polygons,
 * the 7th arc and full debris inventories are deliberately NOT hand-entered — they must be ingested
 * from source files in Phase 2 (see docs/ARCHITECTURE.md §Data acquisition).
 */
export const LAYERS: LayerDef[] = [
  {
    id: 'flight-departure',
    group: 'Flight information',
    name: 'Departure airport (KLIA)',
    kind: 'geojson',
    geometry: 'point',
    evidenceClass: 'verified_observation',
    defaultVisible: true,
    data: fc([
      pt(101.7099, 2.7456, {
        id: 'feat-klia',
        name: 'Kuala Lumpur International Airport (WMKK)',
        date: '2014-03-07T16:42Z (00:42 MYT, 8 Mar)',
        description: 'Departure airport of MH370 (9M-MRO), scheduled to Beijing. Point is the airport location, not the departure runway threshold.',
        evidenceClass: 'verified_observation',
        source: 'ATSB — The Operational Search for MH370 (final report, Oct 2017)',
        sourceUrl: ATSB_FINAL,
        publicationDate: '2017-10-03',
        spatialAccuracy: 'Airport-level, ~2 km',
        methodology: 'Public aeronautical location of the aerodrome',
        confidence: 'high',
        verificationNote: 'Replace with AIP Malaysia aerodrome reference point during Phase 2.',
      }),
    ]),
  },
  {
    id: 'flight-last-ssr',
    group: 'Flight information',
    name: 'Last secondary-radar area (IGARI)',
    kind: 'geojson',
    geometry: 'point',
    evidenceClass: 'published_interpretation',
    defaultVisible: true,
    data: fc([
      pt(103.585, 6.9364, {
        id: 'feat-igari',
        name: 'Waypoint IGARI',
        date: '2014-03-07 ~17:20Z (~01:20 MYT)',
        description:
          'Navigation waypoint near which the aircraft\'s transponder (secondary radar) data was lost. Marker shows the waypoint, NOT the aircraft\'s exact position at loss of transponder.',
        evidenceClass: 'published_interpretation',
        source: 'Malaysia MOT Safety Investigation Report (2018); ATSB final report (2017)',
        sourceUrl: 'https://www.mot.gov.my/',
        publicationDate: '2018-07-30',
        spatialAccuracy: 'Waypoint coordinate; aircraft position relative to it ~ several km',
        methodology: 'Published waypoint coordinate',
        confidence: 'medium',
        verificationNote: 'Verify coordinate against AIP Malaysia ENR 4.4 before analytical use.',
      }),
    ]),
  },
  {
    id: 'flight-primary-radar',
    group: 'Flight information',
    name: 'Primary radar track (military)',
    kind: 'geojson',
    geometry: 'line',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: {
      reason: 'Only a figure of the primary radar track is published; no raw radar data is public. Digitising the figure would introduce unquantified error.',
      requiredSource: 'Malaysia Safety Investigation Report (2018) radar figures — digitise with stated error, or obtain raw data',
      sourceUrl: 'https://www.mot.gov.my/',
    },
  },
  {
    id: 'flight-arcs',
    group: 'Flight information',
    name: 'BTO arcs 1–7 (incl. 7th arc)',
    kind: 'geojson',
    geometry: 'line',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: {
      reason:
        'Arcs must be computed from published BTO values and Inmarsat-3F1 ephemeris, not traced. The 7th arc is a constraint on position at ~00:19 UTC, never an aircraft location.',
      requiredSource: 'Inmarsat data communication logs (released by Malaysia, May 2014) + DSTG "Bayesian Methods in the Search for MH370" (2016)',
      sourceUrl: ATSB_FINAL,
    },
  },
  {
    id: 'search-areas',
    group: 'Historical underwater searches',
    name: 'Search area boundaries (2014–2017, 2018, 2025–26)',
    kind: 'geojson',
    geometry: 'polygon',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: {
      reason: 'Boundaries must be ingested from published survey extents, not redrawn by hand.',
      requiredSource: 'Geoscience Australia MH370 data release (bathymetry & sonar extents); ATSB final report; Ocean Infinity / Malaysia AAIB statements',
      sourceUrl: 'https://www.ga.gov.au/scientific-topics/marine-and-coastal/showcase/mh370-data-release',
    },
  },
  {
    id: 'search-sonar-coverage',
    group: 'Historical underwater searches',
    name: 'Sonar coverage & gaps',
    kind: 'geojson',
    geometry: 'polygon',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: {
      reason: 'Coverage classes (confirmed / partial / insufficient resolution / unknown) require survey-line metadata. Missing data will be shown as UNKNOWN, never as unsearched.',
      requiredSource: 'GA Phase 1 & 2 data packages; Ocean Infinity 2018 & 2025–26 coverage (not yet public)',
      sourceUrl: 'https://www.ga.gov.au/scientific-topics/marine-and-coastal/showcase/mh370-data-release',
    },
  },
  {
    id: 'ocean-gebco',
    group: 'Oceanography',
    name: 'Bathymetry — GEBCO (reference WMS)',
    kind: 'raster',
    evidenceClass: 'published_interpretation',
    defaultVisible: false,
    tiles: [
      'https://wms.gebco.net/mapserv?service=WMS&request=GetMap&version=1.3.0&layers=GEBCO_LATEST&styles=&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png',
    ],
    attribution: 'Bathymetry: GEBCO Compilation Group, GEBCO grid',
  },
  {
    id: 'ocean-currents',
    group: 'Oceanography',
    name: 'Surface currents',
    kind: 'geojson',
    geometry: 'line',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: {
      reason: 'No current field is drawn until a real reanalysis product is ingested for the 2014–2016 drift period.',
      requiredSource: 'Copernicus Marine (GLORYS / Globcurrent) or BRAN2020 (CSIRO) — free registration',
      sourceUrl: 'https://marine.copernicus.eu/',
    },
  },
  {
    id: 'ocean-debris',
    group: 'Oceanography',
    name: 'Recovered debris (confirmed 9M-MRO)',
    kind: 'geojson',
    geometry: 'point',
    evidenceClass: 'verified_observation',
    defaultVisible: true,
    data: fc([
      pt(55.65, -20.94, {
        id: 'deb-flaperon',
        name: 'Right flaperon — Saint-André, Réunion',
        date: 'Found 2015-07-29',
        description:
          'First debris item recovered. Identified as from 9M-MRO by French judicial authorities (Sept 2015). Marker is the locality, not the exact beach position.',
        evidenceClass: 'verified_observation',
        source: 'ATSB debris examination reports; Malaysia SIR (2018)',
        sourceUrl: ATSB_FINAL,
        publicationDate: '2018-07-30',
        spatialAccuracy: 'Locality-level, ~5 km',
        methodology: 'Town of recovery as reported; exact find coordinates not published',
        confidence: 'high',
        verificationNote: 'Identification: confirmed. Position: locality only.',
      }),
      pt(39.75, -5.2, {
        id: 'deb-outboard-flap',
        name: 'Right outboard flap section — Pemba Island, Tanzania',
        date: 'Found June 2016',
        description: 'Outboard flap section confirmed by ATSB as from 9M-MRO (Oct 2016). Marker is island-level only.',
        evidenceClass: 'verified_observation',
        source: 'ATSB debris examination report (Oct 2016)',
        sourceUrl: ATSB_FINAL,
        publicationDate: '2016-10-07',
        spatialAccuracy: 'Island-level, ~30 km',
        methodology: 'Island of recovery as reported',
        confidence: 'high',
        verificationNote: 'Identification: confirmed. Position: island only.',
      }),
    ]),
  },
  {
    id: 'research-candidates',
    group: 'Research layers',
    name: 'Candidate search regions',
    kind: 'geojson',
    geometry: 'polygon',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: { reason: 'Produced by Phase 3 scoring models. Will be labelled as experimental model output.', requiredSource: 'model_runs table (Phase 3)' },
  },
  {
    id: 'research-trajectories',
    group: 'Research layers',
    name: 'Model-generated trajectories',
    kind: 'geojson',
    geometry: 'line',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: { reason: 'Produced by flight-path and drift models (Phase 3). Every run will record seed, inputs and version.', requiredSource: 'model_runs table (Phase 3)' },
  },
  {
    id: 'research-uncertainty',
    group: 'Research layers',
    name: 'Uncertainty overlays',
    kind: 'geojson',
    geometry: 'polygon',
    evidenceClass: 'pending',
    defaultVisible: false,
    pending: { reason: 'Requires ensemble outputs from Phase 3 models.', requiredSource: 'model_runs table (Phase 3)' },
  },
]

export const LAYER_GROUPS = ['Flight information', 'Historical underwater searches', 'Oceanography', 'Research layers'] as const
