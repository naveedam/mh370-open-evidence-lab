// Read-only research API over native PostgreSQL/PostGIS. Zero framework dependencies (node:http + pg).
// Connects as the least-privilege oel_api role (SELECT only). Writes happen via the ingestion
// pipeline (oel_ingest role), never from the public internet.
//   DATABASE_URL=postgres://oel_api:pw@host:5432/mh370_oel PORT=8787 npm run api
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, statement_timeout: 10_000 })
const PORT = Number(process.env.PORT ?? 8787)
const ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:4173').split(',').map((s) => s.trim())

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json') {
  res.writeHead(status, { 'content-type': type, 'cache-control': status === 200 ? 'public, max-age=60' : 'no-store' })
  res.end(JSON.stringify(body))
}

const routes: Record<string, (url: URL) => Promise<[number, unknown, string?]>> = {
  '/api/health': async () => {
    const { rows } = await pool.query<{ postgis: string }>('select postgis_lib_version() as postgis')
    return [200, { status: 'ok', db: 'postgres', postgis: rows[0].postgis }]
  },
  '/api/datasets': async () => {
    const { rows } = await pool.query(
      `select slug as id, name, organisation, original_url as url, publication_date as "publicationDate", acquisition_date as "acquisitionDate",
              coverage_description as coverage, data_format as format, licensing, quality_assessment as quality,
              processing_history as "processingHistory", access, ingestion as "ingestionStatus", tags, ecat_uuid as "ecatUuid"
       from research_datasets order by name`,
    )
    return [200, rows]
  },
  '/api/features': async (url) => {
    const layer = url.searchParams.get('layer')
    const { rows } = await pool.query(
      `select coalesce(json_agg(json_build_object(
          'type','Feature',
          'geometry', ST_AsGeoJSON(geom, 6)::json,
          'properties', json_build_object(
            'id', feature_id, 'layer', layer_id, 'name', name, 'description', description, 'evidenceClass', evidence_class,
            'source', source_text, 'sourceUrl', source_url, 'publicationDate', publication_date, 'date', observed_at,
            'spatialAccuracy', spatial_accuracy, 'methodology', methodology, 'confidence', confidence,
            'verificationNote', verification_note, 'coverageClass', coverage_class))), '[]'::json) as features
       from map_features where $1::text is null or layer_id = $1`,
      [layer],
    )
    return [200, { type: 'FeatureCollection', features: rows[0].features }, 'application/geo+json']
  },
  '/api/coverage': async () => {
    // Areas use the union per class (overlapping surveys are not double counted), on the ellipsoid.
    const { rows } = await pool.query(
      `select coverage::text as class, round((ST_Area(ST_Union(geom)::geography) / 1e6)::numeric, 0)::float8 as "areaKm2", count(*)::int as surveys
       from sonar_surveys where superseded_by_run is null group by coverage order by coverage`,
    )
    return [200, rows]
  },
  '/api/hypotheses': async () => {
    const { rows } = await pool.query(
      `select code as id, title, description, supporting_evidence as "supportingEvidence", contradicting_evidence as "contradictingEvidence",
              assumptions, confidence, data_dependencies as "dataDependencies", '{}'::text[] as "modelOutputs", status, origin
       from hypotheses order by code`,
    )
    return [200, rows]
  },
}

export async function handle(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin
  if (origin && ORIGINS.includes(origin)) {
    res.setHeader('access-control-allow-origin', origin)
    res.setHeader('vary', 'origin')
  }
  if (req.method === 'OPTIONS') return void res.writeHead(204, { 'access-control-allow-methods': 'GET' }).end()
  if (req.method !== 'GET') return send(res, 405, { error: 'read-only API' })
  const url = new URL(req.url ?? '/', 'http://localhost')
  const route = routes[url.pathname]
  if (!route) return send(res, 404, { error: 'not found' })
  try {
    const [status, body, type] = await route(url)
    send(res, status, body, type)
  } catch (e) {
    console.error(e)
    send(res, 500, { error: 'database error' })
  }
}

{
  createServer(handle).listen(PORT, () => console.log(`OEL API listening on :${PORT}`))
}
