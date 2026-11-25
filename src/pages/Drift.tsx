import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { useData } from '@/lib/data'

export default function Drift() {
  const { layers: LAYERS } = useData()
  const debris = LAYERS.find((l) => l.id === 'ocean-debris')?.data?.features ?? []
  const [p, setP] = useState({ direction: 'backward', particles: 10000, seed: 42, windagePct: 1.2, windageSigma: 0.5, horizDiffusivity: 10, days: 500, currentProduct: 'Copernicus GLORYS12V1', windProduct: 'ERA5 10 m wind', stokes: true })
  const set = (k: keyof typeof p, v: unknown) => setP((x) => ({ ...x, [k]: v }))
  const runRecord = useMemo(
    () => ({
      model: 'oel-drift-lagrangian', software_version: '0.1.0', random_seed: p.seed,
      parameters: p, input_datasets: ['ds-copernicus@pending', 'debris_recoveries@seed-v0.1'],
      limitations: ['Windage of real debris items varies by item and orientation', 'Recovery date ≠ beaching date', 'Reanalysis currents are smoothed'],
      status: 'not-executed',
    }),
    [p],
  )
  const num = (k: keyof typeof p, label: string, step = 1) => (
    <label className="block"><span className="label">{label}</span>
      <input type="number" step={step} className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 mono text-slate-200" value={p[k] as number} onChange={(e) => set(k, +e.target.value)} /></label>
  )
  return (
    <div>
      <PageHeader title="Ocean Drift Modelling" phase="Phase 3 framework" subtitle="Configure Lagrangian drift experiments. A simulated trajectory never establishes the crash location." />
      <div className="grid grid-cols-[360px_1fr] gap-4 p-6">
        <Card>
          <CardHeader title="Simulation parameters" />
          <CardBody className="space-y-3 text-xs">
            <label className="block"><span className="label">Direction</span>
              <select className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={p.direction} onChange={(e) => set('direction', e.target.value)}><option value="backward">Backward ensemble (from recoveries)</option><option value="forward">Forward (from candidate origins)</option></select></label>
            <div className="grid grid-cols-2 gap-2">{num('particles', 'Particles')}{num('seed', 'Random seed')}{num('windagePct', 'Windage %', 0.1)}{num('windageSigma', 'Windage σ %', 0.1)}{num('horizDiffusivity', 'Kh (m²/s)')}{num('days', 'Duration (days)')}</div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={p.stokes} onChange={(e) => set('stokes', e.target.checked)} /> Include Stokes drift</label>
            <p className="text-[11px] text-slate-500">Default values are placeholders for sensitivity testing, not calibrated parameters.</p>
            <Button disabled title="Requires ingested current & wind fields">Run simulation</Button>
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Inputs" />
            <CardBody className="space-y-3">
              <div>
                <div className="label mb-1">Debris recovery points ({debris.length} loaded)</div>
                {debris.map((d) => <div key={d.properties.id} className="text-xs text-slate-300">{d.properties.name} · <span className="text-slate-500">{d.properties.date} · {d.properties.spatialAccuracy}</span></div>)}
              </div>
              <EmptyState title="Current & wind fields not ingested" reason="Runs are disabled until real reanalysis fields covering Mar 2014 – 2016 are downloaded, versioned and registered as datasets." required="Copernicus Marine GLORYS / ERA5 (free registration)" href="https://marine.copernicus.eu/" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Model run record (preview)" right={<span className="text-[10px] text-slate-500">written to model_runs on execution</span>} />
            <CardBody><pre className="max-h-72 overflow-auto rounded bg-ink-850 p-3 mono text-[11px] text-slate-400">{JSON.stringify(runRecord, null, 2)}</pre></CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
