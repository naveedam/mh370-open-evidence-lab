"""Double-entry transcription QA. Two people (or two independent passes) type the same source table
into separate CSVs; only byte-for-byte agreeing records may be loaded."""
import csv
from pathlib import Path


def read(path: Path, key: str) -> dict[str, dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    out = {}
    for i, r in enumerate(rows, start=2):
        k = (r.get(key) or "").strip()
        if not k:
            raise ValueError(f"{path.name} line {i}: missing {key}")
        if k in out:
            raise ValueError(f"{path.name} line {i}: duplicate {key} {k}")
        out[k] = {c: (v or "").strip() for c, v in r.items()}
    return out


def compare(a: Path, b: Path, key: str) -> tuple[list[dict[str, str]], list[str]]:
    ra, rb = read(a, key), read(b, key)
    problems = []
    for k in sorted(set(ra) ^ set(rb)):
        problems.append(f"{k}: present in only one file")
    agreed = []
    for k in sorted(set(ra) & set(rb)):
        diffs = [c for c in ra[k] if ra[k].get(c) != rb[k].get(c)]
        if diffs:
            for c in diffs:
                problems.append(f"{k}.{c}: '{ra[k].get(c)}' vs '{rb[k].get(c)}'")
        else:
            agreed.append(ra[k])
    return agreed, problems
