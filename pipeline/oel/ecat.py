"""Resolve download links from Geoscience Australia's eCat (GeoNetwork) ISO 19139 metadata.
Links are read from the authoritative record at run time — nothing is hard-coded."""
from dataclasses import dataclass

import requests
from lxml import etree

ECAT = "https://ecat.ga.gov.au/geonetwork/srv/api/records/{uuid}/formatters/xml"
NS = {"gmd": "http://www.isotc211.org/2005/gmd", "gco": "http://www.isotc211.org/2005/gco"}


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


def _text(el, path):
    r = el.xpath(path, namespaces=NS)
    return r[0].strip() if r and isinstance(r[0], str) else None


def fetch(uuid: str, timeout=60) -> Record:
    r = requests.get(ECAT.format(uuid=uuid), timeout=timeout, headers={"Accept": "application/xml"})
    r.raise_for_status()
    root = etree.fromstring(r.content)
    title = _text(root, "//gmd:identificationInfo//gmd:citation//gmd:title/gco:CharacterString/text()") or uuid
    links = []
    for ol in root.xpath("//gmd:distributionInfo//gmd:CI_OnlineResource", namespaces=NS):
        url = _text(ol, "gmd:linkage/gmd:URL/text()")
        if not url:
            continue
        links.append(Link(url, _text(ol, "gmd:name/gco:CharacterString/text()") or "", _text(ol, "gmd:protocol/gco:CharacterString/text()") or ""))
    bb = root.xpath("//gmd:EX_GeographicBoundingBox", namespaces=NS)
    bbox = None
    if bb:
        g = lambda t: float(_text(bb[0], f"gmd:{t}/gco:Decimal/text()"))  # noqa: E731
        try:
            bbox = (g("westBoundLongitude"), g("southBoundLatitude"), g("eastBoundLongitude"), g("northBoundLatitude"))
        except (TypeError, ValueError):
            bbox = None
    lic = _text(root, "//gmd:resourceConstraints//gmd:otherConstraints/gco:CharacterString/text()")
    return Record(uuid, title, links, bbox, lic)
