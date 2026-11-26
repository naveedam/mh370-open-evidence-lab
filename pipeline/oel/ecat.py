"""Resolve download links from Geoscience Australia's eCat (GeoNetwork) metadata.
Links are read from the authoritative record at run time — nothing is hard-coded.
Namespace-agnostic: handles ISO 19115-3 (mdb/cit/mrd, what eCat serves) and legacy ISO 19139 (gmd)."""
from dataclasses import dataclass

import requests
from lxml import etree

ECAT = "https://ecat.ga.gov.au/geonetwork/srv/api/records/{uuid}/formatters/xml"
HEADERS = {"Accept": "application/xml", "User-Agent": "mh370-open-evidence-lab-pipeline (+https://github.com/naveedam/mh370-open-evidence-lab)"}


@dataclass
class Link:
    url: str
    name: str
    protocol: str


@dataclass
class Record:
    uuid: str
    title: str
    links: list[Link]
    bbox: tuple[float, float, float, float] | None
    licence: str | None


def _first_text(el, local: str) -> str | None:
    """Text of the first descendant <*:local> — taking its own text or that of its child (gco:CharacterString / gmd:URL)."""
    for node in el.iter("{*}" + local):
        txt = (node.text or "").strip() or "".join(c.text or "" for c in node).strip()
        if txt:
            return txt
    return None


def parse(xml: bytes, uuid: str) -> Record:
    root = etree.fromstring(xml)
    ident = next(root.iter("{*}identificationInfo"), root)
    title = _first_text(next(ident.iter("{*}citation"), ident), "title") or uuid
    links, seen = [], set()
    for dist in root.iter("{*}distributionInfo"):
        for ol in dist.iter("{*}CI_OnlineResource"):
            url = _first_text(ol, "linkage")
            if not url or url in seen:
                continue
            seen.add(url)
            links.append(Link(url, _first_text(ol, "name") or "", _first_text(ol, "protocol") or ""))
    bbox = None
    bb = next(root.iter("{*}EX_GeographicBoundingBox"), None)
    if bb is not None:
        try:
            bbox = tuple(float(_first_text(bb, k)) for k in ("westBoundLongitude", "southBoundLatitude", "eastBoundLongitude", "northBoundLatitude"))
        except (TypeError, ValueError):
            bbox = None
    lic = None
    for c in root.iter("{*}otherConstraints"):
        t = "".join(c.itertext()).strip()
        if "licen" in t.lower() or "creative commons" in t.lower():
            lic = t
            break
    return Record(uuid, title, links, bbox, lic)


def fetch(uuid: str, timeout=60) -> Record:
    r = requests.get(ECAT.format(uuid=uuid), timeout=timeout, headers=HEADERS)
    r.raise_for_status()
    return parse(r.content, uuid)
