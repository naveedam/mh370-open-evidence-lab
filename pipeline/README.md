# Phase 2 ingestion pipeline

Python 3.10+. Runs on the VPS next to PostgreSQL, using the `oel_ingest` role (insert/update only —
it cannot delete; re-derivations *supersede* old rows, which stay in the database for audit).
Every command is logged in `ingestion_runs` and appended to the dataset's `processing_history`.

```bash
cd pipeline
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt          # rasterio/pyproj wheels bundle GDAL/PROJ — no system GDAL needed
set -a; . ../.env; set +a                # needs DATABASE_INGEST_URL
cd .. && npm run db:migrate && npm run db:seed && cd pipeline   # applies 003, registers the datasets
```

## 1 · Phase 1 bathymetry footprints (≈ 194 MB download)

```bash
python -m oel links d887e71a-71dc-4851-94a9-920f7b7cc7e5      # inspect the eCat record first
python -m oel acquire ds-ga-p1-bathy-150m --match 150m         # download + SHA-256 + manifest
python -m oel footprints ds-ga-p1-bathy-150m \
    --campaign "Phase 1 bathymetry survey (2014–2015)" \
    --coverage insufficient_resolution --platform "Fugro Equator / Zhu Kezhen"
```

Why `insufficient_resolution`: a 150 m multibeam grid shows where the seafloor was *mapped*, which
defined the later sonar search — it is not a wreck search. Use `confirmed_searched` only for
sonar coverage whose documentation shows detection-adequate resolution.

Download links are read from the eCat record at run time; nothing is hard-coded. If GA changes
the record, `links` shows the new options and `--match` selects one.

## 2 · Phase 2 sonar data (large collection)

```bash
python -m oel links 11759ecd-b6ea-4e98-95fd-b966cd5735b3
```
Review sizes before acquiring — the collection holds raw survey data. Ingest coverage products
(footprints/mosaics) rather than raw sonar where possible, and record the sonar resolution with
`--resolution-m` from the survey documentation.

## 3 · Debris inventory (manual transcription, double-entry)

1. Copy `templates/debris_recoveries.csv` twice; two independent passes fill them from the source
   (e.g. Malaysia SIR 2018 debris appendix), with page references. Read `templates/README.md`.
2. `python -m oel transcribe-check debris_a.csv debris_b.csv` — lists every disagreement.
3. Fix against the source until the check passes, then
   `python -m oel load-debris debris_a.csv debris_b.csv` (refuses to load if they disagree).

Items without published coordinates are stored without geometry and are **not** drawn on the map.

## Verify

```bash
curl -s localhost:8787/api/coverage
curl -s "localhost:8787/api/features?layer=search-sonar-coverage" | head -c 600
```
The Search Coverage Analysis page shows area per coverage class; the Explorer's "Sonar coverage
& gaps" layer activates automatically once rows exist.

Downloaded files live in `pipeline/data/` (git-ignored). Keep them: checksums in the database
let anyone confirm they are reproducing from identical inputs.
