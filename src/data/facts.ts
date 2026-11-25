/** Overview facts. Each carries its source. Values not verified here are rendered as "Data pending". */
export interface Fact {
  label: string
  value: string | null
  source: string
  sourceUrl?: string
}

export const FLIGHT_FACTS: Fact[] = [
  { label: 'Flight', value: 'Malaysia Airlines MH370 (KUL → PEK)', source: 'ATSB final report, 2017', sourceUrl: 'https://www.atsb.gov.au/mh370-operational-search-reports' },
  { label: 'Aircraft', value: 'Boeing 777-200ER, reg. 9M-MRO', source: 'ATSB final report, 2017', sourceUrl: 'https://www.atsb.gov.au/mh370-operational-search-reports' },
  { label: 'Date', value: '8 March 2014 (00:42 MYT departure)', source: 'Malaysia SIR, 2018', sourceUrl: 'https://www.mot.gov.my/' },
  { label: 'Persons on board', value: '239', source: 'Malaysia SIR, 2018', sourceUrl: 'https://www.mot.gov.my/' },
  { label: 'Last ATC voice contact', value: '01:19 MYT (17:19 UTC)', source: 'Malaysia SIR, 2018', sourceUrl: 'https://www.mot.gov.my/' },
  { label: 'Last satcom transmission', value: '00:19 UTC (7th arc)', source: 'ATSB final report, 2017', sourceUrl: 'https://www.atsb.gov.au/mh370-operational-search-reports' },
]

export interface StatusEntry {
  date: string
  text: string
  source: string
  sourceUrl: string
}

/** Search history — most recent first. Checked 2026-11-25. */
export const SEARCH_STATUS: StatusEntry[] = [
  {
    date: '2026-06-29',
    text: 'Malaysia extended the "no-find, no-fee" Ocean Infinity contract to 30 June 2027 to complete the remaining ~7,429 km² of the designated area.',
    source: 'Associated Press via ABC News',
    sourceUrl: 'https://abcnews.com/International/wireStory/malaysia-extends-search-mh370-year-keeping-families-hopes-134301629',
  },
  {
    date: '2026-03-08',
    text: 'Malaysia AAIB: Ocean Infinity seabed search (Mar 2025 – Jan 2026) produced no findings confirming the wreck location.',
    source: 'Malaysia AAIB statement, reported by NPR/AP',
    sourceUrl: 'https://www.npr.org/2026/03/09/g-s1-112960/12-years-missing-flight-mh370',
  },
  {
    date: '2018-05',
    text: 'First Ocean Infinity private search ended without locating the aircraft.',
    source: 'PBS NewsHour / AP',
    sourceUrl: 'https://www.pbs.org/newshour/world/renewed-search-for-missing-flight-mh370-comes-up-empty-12-years-later-as-families-press-for-answers',
  },
  {
    date: '2017-01-17',
    text: 'Tripartite (Malaysia, Australia, China) underwater search suspended; ATSB final report published Oct 2017.',
    source: 'ATSB',
    sourceUrl: 'https://www.atsb.gov.au/mh370-operational-search-reports',
  },
]

/**
 * Satcom transaction times (UTC, 7–8 Mar 2014) as listed in the ATSB final report.
 * Times rounded to the minute. BTO/BFO values are NOT reproduced here — they await
 * transcription + QA from the released Inmarsat log (dataset ds-inmarsat-log).
 */
export const HANDSHAKES = [
  { t: '16:42', label: 'Departure KLIA', type: 'event', arc: null },
  { t: '17:07', label: 'Last ACARS report', type: 'event', arc: null },
  { t: '17:21', label: 'Transponder data lost near IGARI', type: 'event', arc: null },
  { t: '18:25', label: 'Log-on (aircraft-initiated)', type: 'handshake', arc: 1 },
  { t: '18:39', label: 'Unanswered ground-to-air call', type: 'call', arc: null },
  { t: '19:41', label: 'Handshake (ground-initiated)', type: 'handshake', arc: 2 },
  { t: '20:41', label: 'Handshake', type: 'handshake', arc: 3 },
  { t: '21:41', label: 'Handshake', type: 'handshake', arc: 4 },
  { t: '22:41', label: 'Handshake', type: 'handshake', arc: 5 },
  { t: '23:14', label: 'Unanswered ground-to-air call', type: 'call', arc: null },
  { t: '00:11', label: 'Handshake', type: 'handshake', arc: 6 },
  { t: '00:19', label: 'Log-on request (aircraft-initiated) — 7th arc', type: 'handshake', arc: 7 },
  { t: '01:15', label: 'No response to ground-initiated handshake', type: 'event', arc: null },
] as const
