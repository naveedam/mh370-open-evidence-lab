-- 002 — least-privilege grants + row-level security for private notes.
-- oel_reader: SELECT on research tables only (no app_users, notes filtered by RLS).
-- oel_writer: ingestion pipeline — insert/update research data; no deletes, no DDL.
revoke all on schema public from public;
grant usage on schema public to oel_reader, oel_writer;

grant select on evidence_sources, research_datasets, geographic_features, flight_observations, debris_recoveries,
  search_areas, sonar_surveys, sonar_annotations, oceanographic_observations, model_runs, model_parameters,
  hypotheses, hypothesis_evidence, research_notes to oel_reader;

grant select, insert, update on all tables in schema public to oel_writer;
grant select on spatial_ref_sys to oel_reader, oel_writer;

-- Notes: readers see only public notes; the writer role sees notes of the user set in app.user_id.
alter table research_notes enable row level security;
create policy notes_public_read on research_notes for select to oel_reader using (is_public);
create policy notes_author_all on research_notes for all to oel_writer
  using (author = nullif(current_setting('app.user_id', true), '')::uuid)
  with check (author = nullif(current_setting('app.user_id', true), '')::uuid);
