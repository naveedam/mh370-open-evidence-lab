-- 003 — Phase 2 ingestion: run log, provenance columns on ingested tables, unified map view.

create table ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  command text not null,
  dataset_slug text,
  pipeline_version text not null,
  parameters jsonb not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','succeeded','failed')),
  rows_written integer,
  message text
);

-- Survey / search coverage provenance
alter table sonar_surveys
  add column campaign text,
  add column evidence_class evidence_class not null default 'published_interpretation',
  add column derivation text,             -- how the polygon was produced, e.g. 'valid-data mask of 150 m grid'
  add column spatial_accuracy text,
  add column ingestion_run_id uuid references ingestion_runs(id),
  add column superseded_by_run uuid references ingestion_runs(id);  -- re-derivations supersede, never delete

alter table search_areas
  add column derivation text,
  add column ingestion_run_id uuid references ingestion_runs(id);

-- Debris: transcription provenance (double-entry QA is mandatory before load)
alter table debris_recoveries
  add column item_code text unique,
  add column evidence_class evidence_class not null default 'verified_observation',
  add column spatial_accuracy text not null default 'unrecorded',
  add column source_page text,
  add column transcription_qa text not null default 'unverified',
  add column ingestion_run_id uuid references ingestion_runs(id);

alter table research_datasets
  add column ecat_uuid text,
  add column local_manifest jsonb;

-- One view the API reads for every map layer, with identical provenance properties.
create view map_features as
  select slug as feature_id, layer_id, name, description, geom, evidence_class::text, source_text, source_url,
         publication_date::text, observed_at, spatial_accuracy, methodology, confidence::text, verification_note,
         null::text as coverage_class
  from geographic_features
union all
  select coalesce(d.item_code, d.id::text), 'ocean-debris', d.item_description,
         concat_ws(' — ', d.location_name, 'identification: ' || d.identification_status), d.geom, d.evidence_class::text,
         s.title || coalesce(' (' || d.source_page || ')', ''), s.url, s.publication_date::text,
         d.found_date::text || coalesce(' (' || d.found_date_precision || ')', ''), d.spatial_accuracy,
         'Transcribed from published source; QA: ' || d.transcription_qa, 'high', null, null
  from debris_recoveries d join evidence_sources s on s.id = d.source_id
  where d.geom is not null
union all
  select v.id::text, 'search-sonar-coverage', coalesce(v.campaign, 'Survey') || ' — ' || coalesce(v.sensor, 'sensor n/a'),
         concat_ws('. ', v.derivation, 'Resolution: ' || coalesce(v.resolution_m::text || ' m', 'not documented')),
         v.geom, v.evidence_class::text, r.name, r.original_url, r.publication_date,
         concat_ws(' to ', v.surveyed_from::text, v.surveyed_to::text), coalesce(v.spatial_accuracy, 'see derivation'),
         coalesce(v.derivation, 'n/a'), 'high', null, v.coverage::text
  from sonar_surveys v left join research_datasets r on r.id = v.dataset_id
  where v.superseded_by_run is null
union all
  select a.id::text, 'search-areas', a.name, concat_ws('. ', a.campaign, a.derivation), a.geom, a.evidence_class::text,
         coalesce(s.title, r.name), coalesce(s.url, r.original_url), coalesce(s.publication_date::text, r.publication_date),
         concat_ws(' to ', a.period_start::text, a.period_end::text), 'as published', coalesce(a.derivation, 'n/a'), 'high', null, null
  from search_areas a left join evidence_sources s on s.id = a.source_id left join research_datasets r on r.id = a.dataset_id;

grant select on map_features, ingestion_runs to oel_reader;
grant select, insert, update on ingestion_runs to oel_writer;
