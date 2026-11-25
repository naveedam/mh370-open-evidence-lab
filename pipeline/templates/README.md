# Transcription templates

Headers only — **no values are pre-filled**. Fill two copies independently from the cited source
(e.g. `debris_a.csv`, `debris_b.csv`), then run `python -m oel transcribe-check`.

`debris_recoveries.csv`
- `item_code`: the source's item number (e.g. the ATSB/SIR item ID). Unique.
- `found_date`: ISO `YYYY-MM-DD`; if only month/year is published use the 1st and set `found_date_precision`.
- `lon`,`lat`: leave **empty** unless the source publishes coordinates. Do not geocode a town into
  a point without also setting `spatial_accuracy_m` and `spatial_accuracy` (e.g. "town centroid, ~5 km").
- `identification_status`: one of `confirmed`, `almost_certain`, `highly_likely`, `likely`, `unconfirmed`,
  exactly as the source classifies it.
- `source_slug`: slug of a row in `evidence_sources` (e.g. `atsb-final-2017`, `mot-sir-2018`).
- `source_page`: page / table / appendix reference so anyone can check the value.
