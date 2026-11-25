"""Derive survey-coverage footprints from gridded bathymetry: the polygon where the grid holds data.
A footprint states WHERE the survey has data, at the grid's resolution — it is not a detection claim."""
import zipfile
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.features import shapes
from rasterio.warp import transform_geom
from shapely import make_valid
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.ops import unary_union

RASTER_EXT = {".tif", ".tiff", ".asc", ".flt", ".bag", ".nc", ".grd", ".img"}


def extract(zip_path: Path, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as z:
        for m in z.infolist():
            target = (out_dir / m.filename).resolve()
            if not str(target).startswith(str(out_dir.resolve())):
                raise ValueError(f"unsafe path in archive: {m.filename}")
        z.extractall(out_dir)
    return out_dir


def find_rasters(root: Path) -> list[Path]:
    found = [p for p in root.rglob("*") if p.suffix.lower() in RASTER_EXT]
    found += [p.parent for p in root.rglob("hdr.adf")]  # ESRI ArcInfo binary grids are directories
    return sorted(set(found))


def raster_footprint(path: Path, max_dim: int = 4000, simplify_deg: float = 0.005) -> tuple[MultiPolygon, dict]:
    with rasterio.open(path) as src:
        scale = max(1, int(np.ceil(max(src.width, src.height) / max_dim)))
        h, w = src.height // scale, src.width // scale
        band = src.read(1, out_shape=(h, w), resampling=Resampling.nearest, masked=True)
        transform = src.transform * src.transform.scale(src.width / w, src.height / h)
        valid = (~np.ma.getmaskarray(band)) & np.isfinite(band.filled(np.nan))
        if src.nodata is None and not np.ma.is_masked(band):
            valid &= band.filled(0) != 0
        polys = [shape(g) for g, v in shapes(valid.astype("uint8"), mask=valid, transform=transform) if v == 1]
        if not polys:
            raise ValueError(f"{path.name}: no valid data cells")
        geom = unary_union(polys)
        if src.crs is None:
            raise ValueError(f"{path.name}: raster has no CRS — refusing to guess")
        geom4326 = shape(transform_geom(src.crs, "EPSG:4326", mapping(geom)))
        meta = {
            "file": path.name,
            "crs": src.crs.to_string(),
            "native_resolution_m": round(abs(src.res[0]), 2) if src.crs.is_projected else None,
            "footprint_sampling_factor": scale,
        }
    geom4326 = make_valid(geom4326.simplify(simplify_deg, preserve_topology=True))
    parts = [g for g in getattr(geom4326, "geoms", [geom4326]) if isinstance(g, Polygon) and not g.is_empty]
    return MultiPolygon(parts), meta
