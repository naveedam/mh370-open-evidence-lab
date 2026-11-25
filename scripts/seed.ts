// Loads the provenance-tagged seed (src/data) into Postgres. Idempotent (upserts on slug/code).
//   DATABASE_ADMIN_URL=... npm run db:seed
import pg from 'pg'
import { LAYERS } from '../src/data/layers.ts'
import { DATASETS } from '../src/data/datasets.ts'
import { SEED_HYPOTHESES } from '../src/data/hypotheses.ts'

const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_INGEST_URL
if (!url) throw new Error('DATABASE_ADMIN_URL or DATABASE_INGEST_URL is required')
const db = new pg.Client({ connectionString: url })
await db.connect()
await db.query('begin')

for (const d of DATASETS) {
  await db.query(
    `insert into research_datasets (slug,name,organisation,original_url,publication_date,acquisition_date,coverage_description,data_format,licensing,quality_assessment,processing_history,access,ingestion,tags)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     on conflict (slug) do update set name=excluded.name, organisation=excluded.organisation, original_url=excluded.original_url,
       publication_date=excluded.publication_date, coverage_description=excluded.coverage_description, data_format=excluded.data_format,
       licensing=excluded.licensing, quality_assessment=excluded.quality_assessment, processing_history=excluded.processing_history,
       access=excluded.access, ingestion=excluded.ingestion, tags=excluded.tags`,
    [d.id, d.name, d.organisation, d.url, d.publicationDate, d.acquisitionDate, d.coverage, d.format, d.licensing, d.quality, JSON.stringify(d.processingHistory), d.access, d.ingestionStatus, d.tags],
  )
}

let n = 0
for (const layer of LAYERS) {
  for (const f of layer.data?.features ?? []) {
    const p = f.properties
    await db.query(
      `insert into geographic_features (slug,layer_id,name,description,geom,evidence_class,source_text,source_url,publication_date,observed_at,spatial_accuracy,methodology,confidence,verification_note)
       values ($1,$2,$3,$4,ST_SetSRID(ST_GeomFromGeoJSON($5),4326),$6,$7,$8,$9,$10,$11,$12,$13,$14)
       on conflict (slug) do update set layer_id=excluded.layer_id, name=excluded.name, description=excluded.description, geom=excluded.geom,
         evidence_class=excluded.evidence_class, source_text=excluded.source_text, source_url=excluded.source_url, publication_date=excluded.publication_date,
         observed_at=excluded.observed_at, spatial_accuracy=excluded.spatial_accuracy, methodology=excluded.methodology,
         confidence=excluded.confidence, verification_note=excluded.verification_note`,
      [p.id, layer.id, p.name, p.description, JSON.stringify(f.geometry), p.evidenceClass, p.source, p.sourceUrl ?? null, p.publicationDate ?? null, p.date ?? null, p.spatialAccuracy, p.methodology, p.confidence, p.verificationNote ?? null],
    )
    n++
  }
}

for (const h of SEED_HYPOTHESES) {
  await db.query(
    `insert into hypotheses (code,title,description,supporting_evidence,contradicting_evidence,assumptions,data_dependencies,confidence,status,origin)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (code) do update set title=excluded.title, description=excluded.description, supporting_evidence=excluded.supporting_evidence,
       contradicting_evidence=excluded.contradicting_evidence, assumptions=excluded.assumptions, data_dependencies=excluded.data_dependencies,
       confidence=excluded.confidence, status=excluded.status, origin=excluded.origin`,
    [h.id, h.title, h.description, h.supportingEvidence, h.contradictingEvidence, h.assumptions, h.dataDependencies, h.confidence, h.status, h.origin],
  )
}

await db.query('commit')
console.log(`seeded ${DATASETS.length} datasets, ${n} features, ${SEED_HYPOTHESES.length} hypotheses`)
await db.end()
