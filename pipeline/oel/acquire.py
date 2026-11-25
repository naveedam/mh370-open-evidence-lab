"""Resumable download with SHA-256 checksum and a JSON manifest next to the file."""
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, dest_dir: Path, retries: int = 5) -> dict:
    dest_dir.mkdir(parents=True, exist_ok=True)
    name = requests.utils.unquote(url.rstrip("/").split("/")[-1].split("?")[0]) or "download.bin"
    dest = dest_dir / name
    part = dest.with_suffix(dest.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            have = part.stat().st_size if part.exists() else 0
            headers = {"Range": f"bytes={have}-"} if have else {}
            with requests.get(url, stream=True, timeout=120, headers=headers) as r:
                if r.status_code == 416:  # already complete
                    break
                r.raise_for_status()
                mode = "ab" if r.status_code == 206 else "wb"
                total = int(r.headers.get("Content-Length", 0)) + (have if mode == "ab" else 0)
                with part.open(mode) as f:
                    done = have if mode == "ab" else 0
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)
                        done += len(chunk)
                        if total:
                            print(f"\r  {name}: {done / 1e6:,.1f} / {total / 1e6:,.1f} MB", end="", flush=True)
                print()
            break
        except requests.RequestException as e:
            if attempt == retries:
                raise
            print(f"  retry {attempt}/{retries} after error: {e}")
            time.sleep(5 * attempt)
    part.replace(dest)
    manifest = {
        "file": dest.name,
        "url": url,
        "bytes": dest.stat().st_size,
        "sha256": sha256(dest),
        "acquired_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (dest_dir / f"{dest.name}.manifest.json").write_text(json.dumps(manifest, indent=2))
    return manifest
