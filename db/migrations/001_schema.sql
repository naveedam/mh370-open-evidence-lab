-- 001 — core schema. PostGIS geometries in EPSG:4326, UUID keys, created/updated timestamps.
create extension if not exists postgis;
create extension if not exists pgcrypto;

create type evidence_class as enum ('verified_observation','published_interpretation','reconstructed_scenario','experimental_model','pending');
create type confidence_level as enum ('high','medium','low','unassessed');
create type access_level as enum ('open-download','open-viewer-only','reports-only','restricted','unverified');
create type ingestion_status as enum ('ingested','catalogued','pending-review');
create type coverage_class as enum ('confirmed_searched','partially_surveyed','insufficient_resolution','unknown');
create type review_state as enum ('queued','confirmed','disputed');
create type hypothesis_status as enum ('proposed','under-evaluation','supported','weakened','rejected');

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Researchers (replaces Supabase auth.users). Authentication is handled by the API layer.
create table app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  role text not null default 'researcher' check (role in ('researcher','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_sources (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  organisation text not null,
  title text not null,
  url text,
  publication_date date,
  citation text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table research_datasets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  organisation text not null,
  source_id uuid references evidence_sources(id),
  original_url text not null,
  publication_date text,
  acquisition_date date,
  version text,
  checksum_sha256 text,
  coverage_description text,
  coverage geometry(MultiPolygon, 4326),
  data_format text,
  licensing text,
  quality_assessment text,
  processing_history jsonb not null default '[]',
  access access_level not null default 'unverified',
  ingestion ingestion_status not null default 'catalogued',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table geographic_features (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  layer_id text not null,
  name text not null,
  description text,
  geom geometry(Geometry, 4326) not null,
  evidence_class evidence_class not null,
  dataset_id uuid references research_datasets(id),
  source_text text not null,
  source_url text,
  publication_date date,
  observed_at text,
  spatial_accuracy text not null,
  spatial_accuracy_m double precision,
  methodology text not null,
  confidence confidence_level not null default 'unassessed',
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table flight_observations (
  id uuid primary key default gen_random_uuid(),
  observed_at timestamptz not null,
  kind text not null check (kind in ('satcom_handshake','satcom_call','acars','ssr_radar','primary_radar','atc_voice','other')),
  arc_number smallint,
  bto_us double precision,   -- transcribed from source only, never estimated
  bfo_hz double precision,   -- transcribed from source only, never estimated
  geom geometry(Point, 4326),
  evidence_class evidence_class not null,
  source_id uuid not null references evidence_sources(id),
  transcription_qa text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table debris_recoveries (
  id uuid primary key default gen_random_uuid(),
  item_description text not null,
  found_date date,
  found_date_precision text check (found_date_precision in ('day','month','year')),
  location_name text,
  geom geometry(Point, 4326),
  spatial_accuracy_m double precision,
  identification_status text not null check (identification_status in ('confirmed','almost_certain','highly_likely','likely','unconfirmed')),
  source_id uuid not null references evidence_sources(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table search_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  campaign text not null,
  period_start date,
  period_end date,
  geom geometry(MultiPolygon, 4326) not null,
  evidence_class evidence_class not null,
  source_id uuid references evidence_sources(id),
  dataset_id uuid references research_datasets(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sonar_surveys (
  id uuid primary key default gen_random_uuid(),
  search_area_id uuid references search_areas(id),
  platform text,
  sensor text,
  frequency_khz double precision,
  resolution_m double precision,
  coverage coverage_class not null default 'unknown',
  geom geometry(MultiPolygon, 4326) not null,
  dataset_id uuid references research_datasets(id),
  surveyed_from date,
  surveyed_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table model_runs (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  software_version text not null,
  random_seed bigint,
  input_dataset_versions jsonb not null,
  executed_at timestamptz,
  executed_by uuid references app_users(id),
  output_uri text,
  limitations text[] not null default '{}',
  status text not null default 'configured' check (status in ('configured','running','succeeded','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table model_parameters (
  id uuid primary key default gen_random_uuid(),
  model_run_id uuid not null references model_runs(id) on delete cascade,
  name text not null,
  value jsonb not null,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_run_id, name)
);

create table sonar_annotations (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid references sonar_surveys(id),
  image_uri text not null,
  bbox jsonb not null,
  geom geometry(Point, 4326),
  label text not null check (label in ('natural_seabed','metallic_object','aircraft_like_structure','debris_cluster','unidentified_anomaly')),
  confidence confidence_level not null default 'low',
  annotator uuid references app_users(id),
  annotation_source text not null default 'human' check (annotation_source in ('human','model')),
  model_run_id uuid references model_runs(id),
  review review_state not null default 'queued',
  reviewer uuid references app_users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (annotation_source = 'human' or model_run_id is not null)
);

create table oceanographic_observations (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references research_datasets(id),
  variable text not null,
  observed_at timestamptz,
  value double precision,
  unit text,
  geom geometry(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hypotheses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  supporting_evidence text[] not null default '{}',
  contradicting_evidence text[] not null default '{}',
  assumptions text[] not null default '{}',
  data_dependencies text[] not null default '{}',
  confidence confidence_level not null default 'unassessed',
  status hypothesis_status not null default 'proposed',
  origin text not null check (origin in ('published','independent')),
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hypothesis_evidence (
  id uuid primary key default gen_random_uuid(),
  hypothesis_id uuid not null references hypotheses(id) on delete cascade,
  axis text not null,
  stance text not null check (stance in ('supports','contradicts','neutral','not_assessed')),
  dataset_id uuid references research_datasets(id),
  source_id uuid references evidence_sources(id),
  model_run_id uuid references model_runs(id),
  rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table research_notes (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references app_users(id),
  subject_table text,
  subject_id uuid,
  body text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on research_datasets using gist (coverage);
create index on geographic_features using gist (geom);
create index on geographic_features (layer_id);
create index on flight_observations (observed_at);
create index on flight_observations using gist (geom);
create index on debris_recoveries using gist (geom);
create index on search_areas using gist (geom);
create index on sonar_surveys using gist (geom);
create index on sonar_annotations using gist (geom);
create index on sonar_annotations (review);
create index on oceanographic_observations using gist (geom);
create index on oceanographic_observations (dataset_id, variable, observed_at);
create index on hypothesis_evidence (hypothesis_id);

do $$
declare t text;
begin
  foreach t in array array['app_users','evidence_sources','research_datasets','geographic_features','flight_observations',
    'debris_recoveries','search_areas','sonar_surveys','model_runs','model_parameters','sonar_annotations',
    'oceanographic_observations','hypotheses','hypothesis_evidence','research_notes']
  loop
    execute format('create trigger %I_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;
