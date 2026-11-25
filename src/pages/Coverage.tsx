import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'

const CLASSES = [
  { k: 'Confirmed searched', c: '#5fb98a', d: 'Survey data present at resolution adequate for wreck detection, per survey metadata.' },
  { k: 'Partially surveyed', c: '#5b9bd5', d: 'Survey lines present with gaps (e.g. terrain shadows, steep slopes).' },
  { k: 'Insufficient resolution', c: '#d6a64a', d: 'Covered only by coarse data (e.g. ship multibeam, GEBCO) — not a search.' },
  { k: 'Unknown coverage', c: '#7b8796', d: 'No data available to us. Never treated as "unsearched".' },
]

const PHASES = [
  { name: 'Tripartite underwater search (ATSB-led)', period: '2014–2017', note: 'Published extent ~120,000 km²', status: 'Extents not yet ingested' },
  { name: 'Ocean Infinity (Seabed Constructor)', period: 'Jan–May 2018', note: 'Extent per OI/Malaysia statements', status: 'Extents not public in GIS form' },
  { name: 'Ocean Infinity (no-find, no-fee)', period: 'Mar 2025 – Jan 2026', note: '15,000 km² designated area', status: 'Extents not public in GIS form' },
]

export default function Coverage() {
  return (
    <div>
      <PageHeader title="Search Coverage Analysis" phase="Phase 3" subtitle="Compare historical sonar coverage against bathymetry. Missing data is classified UNKNOWN, never unsearched." />
      <div className="grid grid-cols-[1fr_360px] gap-4 p-6">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Coverage completeness" />
            <CardBody>
              <div className="mb-2 flex items-baseline justify-between text-xs"><span className="text-slate-400">Area with classified coverage</span><span className="text-pending">Data pending</span></div>
              <div className="h-2 w-full rounded bg-ink-700"><div className="h-2 w-0 rounded bg-verified" /></div>
              <p className="mt-2 text-[11px] text-slate-500">Computed from sonar_surveys geometries in PostGIS once Phase 2 ingestion completes.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Historical search phases" />
            <CardBody>
              <table className="w-full text-xs">
                <thead><tr className="label text-left"><th className="pb-2">Phase</th><th>Period</th><th>Published scale</th><th>GIS status</th></tr></thead>
                <tbody>{PHASES.map((p) => <tr key={p.name} className="border-t border-ink-700"><td className="py-2 text-slate-200">{p.name}</td><td className="mono text-slate-400">{p.period}</td><td className="text-slate-400">{p.note}</td><td className="text-pending">{p.status}</td></tr>)}</tbody>
              </table>
            </CardBody>
          </Card>
          <EmptyState title="Survey polygons not loaded" reason="Coverage polygons and survey resolution will be derived from Geoscience Australia's released bathymetry and sonar packages." required="Geoscience Australia MH370 data release" href="https://www.ga.gov.au/scientific-topics/marine-and-coastal/showcase/mh370-data-release" />
        </div>
        <Card>
          <CardHeader title="Coverage classes" />
          <CardBody className="space-y-3">
            {CLASSES.map((c) => <div key={c.k} className="flex gap-3"><span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: c.c }} /><div><div className="text-xs text-slate-200">{c.k}</div><div className="text-[11px] text-slate-500">{c.d}</div></div></div>)}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
