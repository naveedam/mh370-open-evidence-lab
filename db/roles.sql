-- Run ONCE as a superuser before migrations. Creates group roles (no login) and login roles.
-- Set real passwords afterwards:  ALTER ROLE oel_api PASSWORD '...';  ALTER ROLE oel_ingest PASSWORD '...';
do $$ begin
  if not exists (select from pg_roles where rolname = 'oel_reader') then create role oel_reader nologin; end if;
  if not exists (select from pg_roles where rolname = 'oel_writer') then create role oel_writer nologin; end if;
  if not exists (select from pg_roles where rolname = 'oel_api')    then create role oel_api login in role oel_reader; end if;
  if not exists (select from pg_roles where rolname = 'oel_ingest') then create role oel_ingest login in role oel_writer; end if;
end $$;
