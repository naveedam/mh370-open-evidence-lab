# MH370 Open Evidence Lab — Architecture (v0.1, Phase 1)

## 1. Application architecture

```
┌──────────── Browser (Vercel static) ────────────┐
│ React 19 + TS + Vite + Tailwind (shadcn-style)  │
│  ├─ Layout: sidebar nav · status bar · outlet   │
│  ├─ ResearchMap (MapLibre GL v6)                │
│  │    layer registry → GeoJSON / raster sources │
│  │    click → ProvenancePanel                   │
│  │    measure (haversine) · coords · export     │
│  ├─ Pages: 9 modules (P1 live, P3/P4 shells)    │
│  └─ data/*.ts — provenance-tagged seed (v0.1)   │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS GET /api/* (read-only)
┌──────────────────────▼──────────────────────────┐
│ API: Node 22 node:http + pg  (role oel_api)     │
└──────────────────────┬──────────────────────────┘
┌──────────────────────▼──────────────────────────┐
│ PostgreSQL 16 + PostGIS 3                       │
│  15 tables (14 research + app_users)            │
└──────────────────────▲──────────────────────────┘
                       │ role oel_ingest (insert/update only)
┌──────────────────────┴──────────────────────────┐
│ Python pipeline (Phase 2+) — /pipeline           │
│  NumPy · Pandas · SciPy · GeoPandas · Rasterio   │
│  xarray · (PyTorch, Phase 4)                     │
│  download → checksum → transform → GeoJSON/COG   │
│  → research_datasets + geographic_features       │
└──────────────────────────────────────────────────┘
```

**Key design rule:** every rendered datum carries an `evidenceClass` (verified observation /
published interpretation / reconstructed scenario / experimental model / pending) and a provenance
record. Layers with no ingested data render as *pending* with the source required — never as empty
geometry and never with placeholder coordinates.

`src/lib/data.tsx` loads layers, datasets and hypotheses from the API. If the API is unreachable the app
falls back to the bundled seed in `src/data` (identical records — the DB seed is generated from it) and
the status bar reports "Seed data (API offline)".

## 2. Database schema (see `db/migrations/`)

| Table | Purpose | Geometry |
|---|---|---|
| evidence_sources | Publications / organisations cited | — |
| research_datasets | Dataset catalogue: URL, version, checksum, licence, quality, processing history, access level | MultiPolygon coverage |
| geographic_features | Generic map features with full provenance + evidence class | Geometry |
| flight_observations | Satcom / radar / ACARS / ATC events; BTO/BFO **transcribed only** | Point |
| debris_recoveries | Debris items, identification status, location accuracy | Point |
| search_areas | Campaign boundaries (2014–17, 2018, 2025–26) | MultiPolygon |
| sonar_surveys | Survey extents, sensor, resolution, coverage class | MultiPolygon |
| sonar_annotations | Human/model annotations + review state | Point |
| oceanographic_observations | Point observations tied to datasets | Point |
| model_runs / model_parameters | Seed, inputs, version, timestamp, output, limitations | — |
| hypotheses / hypothesis_evidence | Hypotheses and per-axis evidence stances with citations | — |
| research_notes | Private-by-default researcher notes (RLS) | — |
| app_users | Researchers (replaces a hosted auth service) | — |

Security: privilege separation by Postgres role — `oel_api` can only SELECT research tables; `oel_ingest`
can insert/update but not delete; only `oel_owner` runs DDL. Row-level security hides private
`research_notes`. The HTTP API is GET-only. Researcher login/write endpoints are deferred to Phase 4.

## 3. Dependencies

Runtime: react, react-dom, react-router-dom, maplibre-gl, pg (server only), lucide-react,
clsx, tailwind-merge, class-variance-authority. Dev: vite, typescript, tailwindcss 3, postcss,
autoprefixer, @types/geojson, @types/pg. The API uses no web framework. shadcn/ui is used as a *pattern* (components in `src/components/ui`)
rather than via its CLI — no Radix dependency is needed yet.

Basemaps/overlays (free, keyless): CARTO dark, OpenStreetMap, Esri World Ocean Base, GEBCO WMS.
Review each provider's usage terms before high-traffic production use; self-host tiles if needed.

## 4. Data acquisition assessment

| Dataset | Acquirable? | Notes |
|---|---|---|
| GA MH370 bathymetry / sonar release | **Yes** (open download, reported CC BY 4.0) | Large; convert grids to COG, extents to GeoJSON |
| ATSB reports (final report, debris exams, drift summaries) | **Yes — reports only** | Figures/tables must be transcribed with stated error |
| Malaysia SIR (2018) | **Yes — reports only** | Radar track only as figures |
| Inmarsat SU log (BTO/BFO) | **Yes — PDF table** | Requires careful transcription + double-entry QA |
| DSTG Bayesian analysis (2016, open-access book) | **Yes** | Method reference for Track A reproduction |
| CSIRO drift outputs | **Partial** | Reports open; model output files to be confirmed |
| Copernicus GLORYS / ERA5 winds | **Yes** (free registration) | Needed before any drift run |
| GEBCO grid | **Yes** | Coarse; reference only in search area |
| Ocean Infinity 2018 / 2025–26 coverage | **No (not public in GIS form)** | Shown as unknown coverage |
| Raw military primary radar | **No** | Only published figures |
| Exact debris find coordinates | **Mostly no** | Locality-level only; accuracy recorded |

## 5. Features requiring further research

- Arc computation: Inmarsat-3F1 ephemeris source and BTO calibration method (reproduce DSTG).
- BFO model: oscillator bias/drift assumptions; reproduce published residuals before Track B.
- Debris windage: per-item leeway values (CSIRO replica tests) and their uncertainty.
- Coverage classification: how to derive detection-adequate resolution from GA metadata.
- Sonar ML: availability of labelled side-scan data (aircraft wreck analogues) — none in-repo.
- Licensing: confirm reuse terms for ATSB/Malaysia figures before redistributing digitised data.
