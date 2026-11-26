"""Database-free exports for GitHub Actions: write GeoJSON into public/data/ so the static site
(Vercel) shows ingested data with full provenance, no server or terminal required."""
import json
from datetime import datetime, timezone
from pathlib import Path

from pyproj import Geod
from shapely.geometry import mapping

from . import __version__, acquire, doubleentry, ecat, footprint

GEOD = Geod(ellps="WGS84")
SOURCES = {
    "mot-sir-2018": ("Ministry of Transport Malaysia — Safety Investigation Report MH370 (9M-MRO)", "https://www.mot.gov.my/", "2018-07-30"),
    "atsb-final-2017": ("ATSB — The Operational Search for MH370 (final report)", "https://www.atsb.gov.au/mh370-operational-search-reports", "2017-10-03"),
}
STATUSES = {"confirmed", "almost_certain", "highly_likely", "likely", "unconfirmed"}


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _write(path: Path, fc: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(fc, indent=1, ensure_ascii=False))
    print(f"wrote {path} ({len(fc['features'])} features)")


def fetch(uuid: str, match: str, dest: Path) -> dict:
    rec = ecat.fetch(uuid)
    links = [l for l in rec.links if match.lower() in (l.url + " " + l.name).lower() and l.url.lower().split("?")[0].endswith(".zip")]
    if len(links) != 1:
        print(f"eCat record '{rec.title}' has {len(rec.links)} link(s):")
        for l in rec.links:
            print(f"  - {l.url}")
        raise SystemExit(f"expected exactly one .zip link matching '{match}', found {len(links)}")
    m = acquire.download(links[0].url, dest)
    m.update({"ecat_uuid": uuid, "ecat_title": rec.title, "licence": rec.licence})
    (dest / "manifest.json").write_text(json.dumps(m, indent=2))
    return m


def footprints_geojson(src: Path, out: Path, campaign: str, coverage: str, dataset_name: str, source_url: str,
                       published: str | None, sensor: str, resolution_m: float | None):
    manifest = json.loads((src / "manifest.json").read_text()) if (src / "manifest.json").exists() else {}
    work = src / "extracted"
    for z in sorted(src.glob("*.zip")):
        footprint.extract(z, work / z.stem)
    rasters = footprint.find_rasters(work if work.exists() else src)
    if not rasters:
        raise SystemExit(f"no rasters found in {src}")
    features, summary = [], {}
    for i, r in enumerate(rasters):
        geom, meta = footprint.raster_footprint(r)
        res = resolution_m or meta["native_resolution_m"]
        area_km2 = abs(GEOD.geometry_area_perimeter(geom)[0]) / 1e6
        summary[coverage] = summary.get(coverage, 0) + area_km2
        features.append({
            "type": "Feature",
            "geometry": mapping(geom),
            "properties": {
                "id": f"cov-{coverage}-{i + 1}", "layer": "search-sonar-coverage",
                "name": f"{campaign} — {meta['file']}",
                "description": f"Area where the grid holds data. {sensor}; resolution {res} m. Not a wreck-detection claim.",
                "evidenceClass": "published_interpretation", "coverageClass": coverage,
                "source": dataset_name, "sourceUrl": source_url, "publicationDate": published,
                "date": f"acquired {manifest.get('acquired_at', 'n/a')}",
                "spatialAccuracy": f"Boundary ±~{int((res or 150) * meta['footprint_sampling_factor'])} m + 0.005° simplification",
                "methodology": f"Valid-data mask of '{meta['file']}' ({meta['crs']}), sampled 1:{meta['footprint_sampling_factor']}. "
                               f"Input SHA-256 {manifest.get('sha256', 'n/a')[:16]}…; pipeline v{__version__}",
                "confidence": "high", "areaKm2": round(area_km2),
                "verificationNote": "Reproduce: GitHub Actions → Data pipeline → ga-p1-footprints",
            },
        })
    # Note: per-class area is summed per grid; overlapping UTM-zone grids may double count slightly.
    _write(out, {"type": "FeatureCollection", "generated": _now(), "features": features})
    cov = [{"class": k, "areaKm2": round(v), "surveys": sum(1 for f in features if f["properties"]["coverageClass"] == k)} for k, v in summary.items()]
    (out.parent / "coverage-summary.json").write_text(json.dumps(cov, indent=1))


def debris_geojson(a: Path, b: Path, out: Path):
    agreed, problems = doubleentry.compare(a, b, "item_code")
    if problems:
        print(f"::error::{len(problems)} disagreement(s) between the two transcriptions")
        for p in problems:
            print("MISMATCH", p)
        raise SystemExit(1)
    feats, unplaced, errors = [], 0, []
    for r in agreed:
        code = r["item_code"]
        if r["identification_status"] not in STATUSES:
            errors.append(f"{code}: identification_status must be one of {sorted(STATUSES)}")
        if r["source_slug"] not in SOURCES:
            errors.append(f"{code}: source_slug must be one of {sorted(SOURCES)}")
        if not (r["lon"] and r["lat"]):
            unplaced += 1
            continue
        if not (r["spatial_accuracy_m"] and r["spatial_accuracy"]):
            errors.append(f"{code}: a point needs spatial_accuracy_m and spatial_accuracy")
            continue
        try:
            lon, lat = float(r["lon"]), float(r["lat"])
            assert -180 <= lon <= 180 and -90 <= lat <= 90
        except (ValueError, AssertionError):
            errors.append(f"{code}: invalid lon/lat")
            continue
        title, url, pub = SOURCES.get(r["source_slug"], ("?", None, None))
        feats.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "id": f"debris-{code}", "layer": "ocean-debris", "name": f"{r['item_description']} — {r['location_name']}",
                "description": f"Item {code}. Identification: {r['identification_status'].replace('_', ' ')}.",
                "evidenceClass": "verified_observation" if r["identification_status"] in ("confirmed", "almost_certain") else "published_interpretation",
                "source": f"{title} ({r['source_page']})" if r["source_page"] else title, "sourceUrl": url, "publicationDate": pub,
                "date": f"Found {r['found_date']} ({r['found_date_precision'] or 'precision n/a'})",
                "spatialAccuracy": r["spatial_accuracy"], "methodology": "Transcribed from published source; double-entry verified",
                "confidence": "high", "verificationNote": f"Item code {code} in source",
            },
        })
    if errors:
        for e in errors:
            print("::error::" + e)
        raise SystemExit(1)
    _write(out, {"type": "FeatureCollection", "generated": _now(), "features": feats,
                 "notMapped": unplaced, "note": "Items without published coordinates are not drawn."})
    print(f"{len(agreed)} items agreed; {len(feats)} mapped, {unplaced} without published coordinates")
