# MH370 Open Evidence Lab

*Re-examining the disappearance of Flight MH370 through AI, geospatial intelligence and open scientific evidence.*

Independent research platform. Phase 1 (working foundation) is implemented: app shell, nine-module
navigation, Intelligence Overview, MapLibre Geospatial Explorer (layer management, provenance
inspector, coordinates, distance measurement, basemap switching, GeoJSON export), Evidence
Repository, Methodology, native PostgreSQL/PostGIS schema with a read-only API, and workflow shells for Phases 3–4.

**Integrity rules:** no invented coordinates, measurements, sonar findings or probabilities. Layers
without source data are shown as *pending* with what is required. See `docs/ARCHITECTURE.md`.

## Quick start (frontend only)

```bash
npm install
npm run dev        # http://localhost:5173 — runs on bundled seed data if no API is reachable
npm run build      # type-check + production build → dist/
```

Requires Node ≥ 22.18 (the API and scripts run TypeScript natively, no build step).

## Database: native PostgreSQL + PostGIS

Requirements: PostgreSQL 14+ with PostGIS 3 (tested on PostgreSQL 16 + PostGIS 3.4.2).
Ubuntu/Debian: `sudo apt install postgresql postgis`.

```bash
# 1. As the postgres superuser — create owner, database, roles and extensions
sudo -u postgres psql -c "create role oel_owner login password 'CHANGE_ME'"
sudo -u postgres psql -c "create database mh370_oel owner oel_owner"
sudo -u postgres psql -d mh370_oel -f db/roles.sql
sudo -u postgres psql -d mh370_oel -c "create extension postgis; create extension pgcrypto;"
sudo -u postgres psql -c "alter role oel_api password 'CHANGE_ME'; alter role oel_ingest password 'CHANGE_ME';"

# 2. Configure, migrate, seed
cp .env.example .env          # fill in the three DATABASE_* URLs
npm run db:migrate            # applies db/migrations/*.sql once each (tracked in schema_migrations)
npm run db:seed               # loads the provenance-tagged seed from src/data (idempotent)

# 3. Run the API and the app
npm run api                   # http://localhost:8787/api/health
npm run dev                   # /api is proxied to :8787 — status bar shows "PostgreSQL · PostGIS x.y"
```

### Database roles (least privilege)

| Role | Login | Rights | Used by |
|---|---|---|---|
| `oel_owner` | yes | Owns schema; DDL | `db:migrate`, `db:seed` only |
| `oel_api` (in `oel_reader`) | yes | SELECT on research tables; no access to `app_users`; only public `research_notes` (RLS) | API server |
| `oel_ingest` (in `oel_writer`) | yes | SELECT/INSERT/UPDATE; no DELETE, no DDL | Phase 2 Python ingestion |

The API is **read-only** (GET only; other methods return 405). There are no public write paths.

### API endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/health` | DB + PostGIS version |
| `GET /api/features[?layer=<id>]` | GeoJSON FeatureCollection with full provenance properties |
| `GET /api/datasets` | Dataset catalogue |
| `GET /api/hypotheses` | Hypotheses |

## Environment variables

| Variable | Used by | Description |
|---|---|---|
| `DATABASE_URL` | API | `oel_api` connection string (read-only) |
| `DATABASE_ADMIN_URL` | migrate / seed | `oel_owner` connection string — never give this to the API |
| `DATABASE_INGEST_URL` | ingestion (Phase 2) | `oel_ingest` connection string |
| `PORT` | API | Default 8787 |
| `CORS_ORIGINS` | API | Comma-separated allowed browser origins |
| `VITE_API_URL` | frontend build | Only when the API is on a different origin, e.g. `https://api.example.org/api` |

## Deployment

**Option A — everything on your VPS (recommended):** Postgres + API + static frontend on one server.
`npm ci && npm run build`, install `deploy/oel-api.service` (systemd) and `deploy/nginx.conf`.
Same origin, so no `VITE_API_URL` and no CORS needed. Add TLS with certbot.

**Option B — frontend on Vercel, API + Postgres on a VPS:** set `VITE_API_URL` in Vercel to your API's
public URL and add the Vercel domain to `CORS_ORIGINS`. `vercel.json` handles SPA routing.

Keep Postgres bound to localhost / a private network; only the API should be exposed (port 443 via nginx).

## Project layout

```
src/
  components/      Layout, LayerPanel, ProvenancePanel, EmptyState, ui/ (shadcn-style)
  components/map/  ResearchMap (MapLibre), basemaps
  data/            Provenance-tagged seed: layers, datasets, facts, hypotheses
  pages/           One file per module
  types/           Evidence / provenance types
server/            Read-only API (node:http + pg)
scripts/           migrate.ts, seed.ts
db/                roles.sql, migrations/
pipeline/          Python ingestion pipeline (Phase 2)
deploy/            systemd unit, nginx config
docs/              Architecture, data acquisition assessment
```

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 | Scaffold, navigation, dashboard, map, evidence repository, schema | ✅ Done |
| 2 | Ingestion pipeline (`pipeline/`): eCat link resolution, checksummed downloads, coverage footprints, double-entry debris transcription | ✅ Built — run on VPS (see `pipeline/README.md`) |
| 3 | Flight reconstruction, drift modelling, coverage analysis | UI shells in place |
| 4 | Sonar annotation (UI done, local-only), CV experiments, hypothesis scoring | Partial UI |

Seed data last checked: 2026-11-25.
