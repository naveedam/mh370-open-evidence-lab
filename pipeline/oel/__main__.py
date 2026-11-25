"""MH370 OEL ingestion CLI.  Run from the pipeline/ directory:  python -m oel <command> --help"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

from shapely.geometry import mapping

from . import __version__, acquire, doubleentry, ecat, footprint
from . import static_export
from .db import connect, run

DATA = Path(__file__).resolve().parents[1] / "data"


def dataset_row(cur, slug):
    cur.execute("select id, ecat_uuid, processing_history from research_datasets where slug=%s", (slug,))
    r = cur.fetchone()
    if not r:
        raise SystemExit(f"dataset '{slug}' not in research_datasets — run `npm run db:seed` first")
    return r


def cmd_links(a):
    rec = ecat.fetch(a.uuid)
    print(f"{rec.title}\nbbox: {rec.bbox}\nlicence: {rec.licence}\n")
    for i, l in enumerate(rec.links):
        print(f"[{i}] {l.protocol or '-'}\n    {l.name}\n    {l.url}")


def cmd_acquire(a):
    conn = connect()
    with conn.cursor() as cur:
        ds_id, uuid, history = dataset_row(cur, a.dataset)
    uuid = a.ecat or uuid
    if not uuid:
        raise SystemExit("no eCat UUID for this dataset; pass --ecat")
    rec = ecat.fetch(uuid)
    links = [l for l in rec.links if a.match.lower() in (l.url + " " + l.name).lower() and l.url.lower().split("?")[0].endswith(".zip")]
    if len(links) != 1:
        print("Expected exactly one matching .zip link, found:", *[l.url for l in links] or ["none"], sep="\n  ")
        raise SystemExit("refine --match (use `links` to inspect the record)")
    with run(conn, "acquire", a.dataset, {"ecat": uuid, "url": links[0].url}) as (run_id, st):
        m = acquire.download(links[0].url, DATA / "raw" / a.dataset)
        step = {"step": "acquired", "at": m["acquired_at"], "file": m["file"], "sha256": m["sha256"], "url": m["url"], "run": str(run_id)}
        with conn.cursor() as cur:
            cur.execute(
                """update research_datasets set acquisition_date=%s, checksum_sha256=%s, ecat_uuid=%s, local_manifest=%s,
                   processing_history = processing_history || %s::jsonb, ingestion='pending-review' where id=%s""",
                (date.today(), m["sha256"], uuid, json.dumps(m), json.dumps([step]), ds_id),
            )
        st["rows"] = 1
    print(json.dumps(m, indent=2))


def cmd_footprints(a):
    conn = connect()
    with conn.cursor() as cur:
        ds_id, _, _ = dataset_row(cur, a.dataset)
    raw = DATA / "raw" / a.dataset
    zips = sorted(raw.glob("*.zip"))
    root = DATA / "work" / a.dataset
    for z in zips:
        footprint.extract(z, root / z.stem)
    rasters = footprint.find_rasters(root if zips else raw)
    if not rasters:
        raise SystemExit(f"no rasters found under {root if zips else raw}")
    params = {k: v for k, v in vars(a).items() if k != "func"}
    with run(conn, "footprints", a.dataset, params) as (run_id, st):
        with conn.cursor() as cur:
            if a.replace:
                cur.execute(
                    "update sonar_surveys set superseded_by_run=%s where dataset_id=%s and campaign=%s and superseded_by_run is null",
                    (run_id, ds_id, a.campaign),
                )
            for r in rasters:
                geom, meta = footprint.raster_footprint(r)
                res = a.resolution_m or meta["native_resolution_m"]
                deriv = (f"Valid-data mask of gridded bathymetry '{meta['file']}' ({meta['crs']}), "
                         f"sampled 1:{meta['footprint_sampling_factor']}, simplified 0.005°")
                cur.execute(
                    """insert into sonar_surveys (dataset_id, campaign, platform, sensor, resolution_m, coverage, geom,
                         evidence_class, derivation, spatial_accuracy, ingestion_run_id)
                       values (%s,%s,%s,%s,%s,%s, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(%s),4326)), 'published_interpretation', %s, %s, %s)""",
                    (ds_id, a.campaign, a.platform, a.sensor, res, a.coverage, json.dumps(mapping(geom)), deriv,
                     f"Boundary ±~{int((res or 150) * meta['footprint_sampling_factor'])} m + 0.005° simplification", run_id),
                )
                st["rows"] += 1
                print(f"  {meta['file']}: {len(geom.geoms)} polygon(s), res {res} m")
            step = {"step": "footprints", "rasters": [str(p.relative_to(DATA)) for p in rasters], "coverage": a.coverage, "run": str(run_id)}
            cur.execute(
                """update research_datasets set processing_history = processing_history || %s::jsonb, ingestion='ingested',
                   coverage = (select ST_Multi(ST_CollectionExtract(ST_Union(geom),3)) from sonar_surveys where dataset_id=%s and superseded_by_run is null) where id=%s""",
                (json.dumps([step]), ds_id, ds_id),
            )
    print(f"done: {st['rows']} footprint row(s)")


def cmd_check(a):
    agreed, problems = doubleentry.compare(Path(a.first), Path(a.second), a.key)
    for p in problems:
        print("MISMATCH", p)
    print(f"{len(agreed)} record(s) agree, {len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


def cmd_load_debris(a):
    agreed, problems = doubleentry.compare(Path(a.first), Path(a.second), "item_code")
    if problems:
        for p in problems:
            print("MISMATCH", p)
        raise SystemExit("refusing to load: the two transcriptions disagree")
    conn = connect()
    with run(conn, "load-debris", None, {"first": a.first, "second": a.second}) as (run_id, st):
        with conn.cursor() as cur:
            for r in agreed:
                cur.execute("select id from evidence_sources where slug=%s", (r["source_slug"],))
                src = cur.fetchone()
                if not src:
                    raise SystemExit(f"{r['item_code']}: unknown source_slug '{r['source_slug']}'")
                has_pt = bool(r["lon"] and r["lat"])
                if has_pt and not (r["spatial_accuracy_m"] and r["spatial_accuracy"]):
                    raise SystemExit(f"{r['item_code']}: a point needs spatial_accuracy_m and spatial_accuracy")
                cur.execute(
                    """insert into debris_recoveries (item_code, item_description, found_date, found_date_precision, location_name, geom,
                         spatial_accuracy_m, spatial_accuracy, identification_status, source_id, source_page, transcription_qa, ingestion_run_id)
                       values (%s,%s,nullif(%s,'')::date,nullif(%s,''),nullif(%s,''),
                         case when %s then ST_SetSRID(ST_MakePoint(%s::float8,%s::float8),4326) end,
                         nullif(%s,'')::float8, coalesce(nullif(%s,''),'unrecorded'), %s, %s, nullif(%s,''), 'double-entry verified', %s)
                       on conflict (item_code) do update set item_description=excluded.item_description, found_date=excluded.found_date,
                         found_date_precision=excluded.found_date_precision, location_name=excluded.location_name, geom=excluded.geom,
                         spatial_accuracy_m=excluded.spatial_accuracy_m, spatial_accuracy=excluded.spatial_accuracy,
                         identification_status=excluded.identification_status, source_id=excluded.source_id, source_page=excluded.source_page,
                         transcription_qa=excluded.transcription_qa, ingestion_run_id=excluded.ingestion_run_id""",
                    (r["item_code"], r["item_description"], r["found_date"], r["found_date_precision"], r["location_name"],
                     has_pt, r["lon"] or None, r["lat"] or None, r["spatial_accuracy_m"], r["spatial_accuracy"],
                     r["identification_status"], src[0], r["source_page"], run_id),
                )
                st["rows"] += 1
    print(f"loaded {st['rows']} debris record(s)")


def main():
    p = argparse.ArgumentParser(prog="python -m oel", description=f"MH370 OEL ingestion pipeline v{__version__}")
    sub = p.add_subparsers(required=True)

    s = sub.add_parser("links", help="list download links in an eCat record")
    s.add_argument("uuid")
    s.set_defaults(func=cmd_links)

    s = sub.add_parser("acquire", help="download a dataset's zip (link resolved from eCat), checksum it, record provenance")
    s.add_argument("dataset", help="research_datasets slug, e.g. ds-ga-p1-bathy-150m")
    s.add_argument("--match", required=True, help="substring identifying the zip link, e.g. '150m'")
    s.add_argument("--ecat", help="override the eCat UUID stored on the dataset")
    s.set_defaults(func=cmd_acquire)

    s = sub.add_parser("footprints", help="derive coverage polygons from acquired grids → sonar_surveys")
    s.add_argument("dataset")
    s.add_argument("--campaign", required=True)
    s.add_argument("--coverage", required=True, choices=["confirmed_searched", "partially_surveyed", "insufficient_resolution", "unknown"])
    s.add_argument("--sensor", default="multibeam echosounder")
    s.add_argument("--platform")
    s.add_argument("--resolution-m", type=float)
    s.add_argument("--replace", action="store_true", help="supersede previous footprints for this dataset+campaign (kept for audit, hidden from the map)")
    s.set_defaults(func=cmd_footprints)

    s = sub.add_parser("transcribe-check", help="compare two independent transcriptions")
    s.add_argument("first")
    s.add_argument("second")
    s.add_argument("--key", default="item_code")
    s.set_defaults(func=cmd_check)

    s = sub.add_parser("load-debris", help="load debris only if both transcriptions agree")
    s.add_argument("first")
    s.add_argument("second")
    s.set_defaults(func=cmd_load_debris)

    s = sub.add_parser("fetch", help="[no DB] download a zip resolved from an eCat record into a folder")
    s.add_argument("uuid")
    s.add_argument("--match", required=True)
    s.add_argument("--dest", required=True)
    s.set_defaults(func=lambda a: static_export.fetch(a.uuid, a.match, Path(a.dest)))

    s = sub.add_parser("footprints-geojson", help="[no DB] coverage footprints → GeoJSON for the static site")
    s.add_argument("src")
    s.add_argument("--out", required=True)
    s.add_argument("--campaign", required=True)
    s.add_argument("--coverage", required=True, choices=["confirmed_searched", "partially_surveyed", "insufficient_resolution", "unknown"])
    s.add_argument("--dataset-name", required=True)
    s.add_argument("--source-url", required=True)
    s.add_argument("--published")
    s.add_argument("--sensor", default="multibeam echosounder")
    s.add_argument("--resolution-m", type=float)
    s.set_defaults(func=lambda a: static_export.footprints_geojson(Path(a.src), Path(a.out), a.campaign, a.coverage, a.dataset_name, a.source_url, a.published, a.sensor, a.resolution_m))

    s = sub.add_parser("debris-geojson", help="[no DB] double-entry check, then debris → GeoJSON for the static site")
    s.add_argument("first")
    s.add_argument("second")
    s.add_argument("--out", required=True)
    s.set_defaults(func=lambda a: static_export.debris_geojson(Path(a.first), Path(a.second), Path(a.out)))

    a = p.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
