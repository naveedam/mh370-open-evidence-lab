import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ResearchMap } from '@/components/map/ResearchMap'
import { PageHeader } from '@/components/PageHeader'
import { FLIGHT_FACTS, SEARCH_STATUS } from '@/data/facts'
import { LAYERS as SEED_LAYERS } from '@/data/layers'
import { useData } from '@/lib/data'

const DEFAULT_VISIBLE = new Set(SEED_LAYERS.filter((l) => l.defaultVisible).map((l) => l.id))

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  const pending = value === 'Data pending'
  return (
    <Card className="px-4 py-3">
      <div className="label">{label}</div>
      <div className={pending ? 'mt-1 text-sm text-pending' : 'mt-1 mono text-2xl text-slate-100'}>{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{note}</div>
    </Card>
  )
}

export default function Overview() {
  const { layers: LAYERS, datasets: DATASETS, hypotheses: SEED_HYPOTHESES } = useData()
  const debris = LAYERS.find((l) => l.id === 'ocean-debris')?.data?.features.length ?? 0
  const gaps = LAYERS.filter((l) => !l.data && !l.tiles).length
  const ingested = DATASETS.filter((d) => d.ingestionStatus === 'ingested').length
  return (
    <div>
      <PageHeader title="Intelligence Overview" subtitle="Re-examining the disappearance of Flight MH370 through AI, geospatial intelligence and open scientific evidence." />
      <div className="grid grid-cols-5 gap-3 px-6 pt-5">
        <Metric label="Verified datasets loaded" value={String(ingested)} note={`of ${DATASETS.length} catalogued sources`} />
        <Metric label="Search coverage represented" value="Data pending" note="Awaiting GA survey extents ingestion" />
        <Metric label="Debris locations mapped" value={String(debris)} note="Confirmed items, locality-level only; full inventory pending" />
        <Metric label="Hypotheses under evaluation" value={String(SEED_HYPOTHESES.length)} note="All confidence: unassessed" />
        <Metric label="Unresolved data gaps" value={String(gaps)} note="Map layers awaiting source data" />
      </div>
      <div className="grid grid-cols-[1fr_360px] gap-4 p-6">
        <Card className="overflow-hidden">
          <CardHeader title="Southern Indian Ocean — evidence map" right={<Link to="/explorer" className="flex items-center gap-1 text-xs text-signal hover:underline">Open explorer <ArrowRight className="h-3 w-3" /></Link>} />
          <div className="h-[460px]"><ResearchMap visible={DEFAULT_VISIBLE} compact /></div>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Flight record" />
            <CardBody className="space-y-2 py-3">
              {FLIGHT_FACTS.map((f) => (
                <div key={f.label} className="grid grid-cols-[120px_1fr] text-xs">
                  <span className="label pt-0.5">{f.label}</span>
                  <span className="text-slate-200" title={`Source: ${f.source}`}>{f.value ?? <span className="text-pending">Data pending</span>}</span>
                </div>
              ))}
              <p className="pt-1 text-[10px] text-slate-600">Hover a value to see its source.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Search status" right={<span className="mono text-[10px] text-slate-600">checked 2026-11-25</span>} />
            <CardBody className="space-y-3 py-3">
              {SEARCH_STATUS.map((s) => (
                <div key={s.date} className="border-l border-ink-600 pl-3">
                  <div className="mono text-[11px] text-signal">{s.date}</div>
                  <p className="text-xs leading-relaxed text-slate-300">{s.text}</p>
                  <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-signal">{s.source} <ExternalLink className="h-2.5 w-2.5" /></a>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        <Card>
          <CardHeader title="Active research hypotheses" />
          <CardBody className="space-y-2">
            {SEED_HYPOTHESES.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-xs">
                <span className="mono text-slate-500">{h.id}</span>
                <span className="flex-1 text-slate-300">{h.title}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{h.status}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Dataset availability" />
          <CardBody className="space-y-1.5">
            {DATASETS.map((d) => (
              <div key={d.id} className="flex items-center gap-3 text-xs">
                <span className="flex-1 truncate text-slate-300">{d.name}</span>
                <span className="text-[10px] text-slate-500">{d.access}</span>
                <span className={d.ingestionStatus === 'ingested' ? 'w-24 text-right text-[10px] uppercase text-verified' : 'w-24 text-right text-[10px] uppercase text-pending'}>{d.ingestionStatus}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
