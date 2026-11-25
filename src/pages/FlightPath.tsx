import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { HANDSHAKES } from '@/data/facts'
import { cn } from '@/lib/utils'

interface Scenario { id: string; name: string; mode: string; speedKt: number; altitudeFt: number; finalTurnUtc: string }

const MODES = ['Constant true track (LNAV-like)', 'Constant magnetic heading', 'Constant true heading', 'Constant magnetic track']

export default function FlightPath() {
  const [form, setForm] = useState<Omit<Scenario, 'id'>>({ name: 'Scenario A', mode: MODES[0], speedKt: 470, altitudeFt: 35000, finalTurnUtc: '18:28' })
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <div>
      <PageHeader title="Flight Path Reconstruction" phase="Phase 3 workspace" subtitle="Published satcom timeline and configurable trajectory assumptions. No Inmarsat measurement is reproduced or synthesised here." />
      <div className="grid grid-cols-[1fr_380px] gap-4 p-6">
        <Card>
          <CardHeader title="Satellite communication timeline (UTC, 7–8 Mar 2014)" right={<span className="text-[10px] text-slate-500">Source: ATSB final report (2017) · times to nearest minute</span>} />
          <CardBody>
            <ol className="relative ml-2 border-l border-ink-600">
              {HANDSHAKES.map((h) => (
                <li key={h.t + h.label} className="mb-3 ml-4">
                  <span className={cn('absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full border', h.type === 'handshake' ? 'border-published bg-published/40' : h.type === 'call' ? 'border-reconstructed bg-transparent' : 'border-slate-500 bg-ink-700')} />
                  <div className="flex items-baseline gap-3 text-xs">
                    <span className="mono w-12 text-slate-200">{h.t}</span>
                    <span className="text-slate-300">{h.label}</span>
                    {h.arc && <span className="mono rounded border border-published/40 px-1 text-[10px] text-published">Arc {h.arc}</span>}
                  </div>
                </li>
              ))}
            </ol>
            <EmptyState
              title="BTO / BFO values not loaded"
              reason="Arc radii and Doppler constraints require the released Inmarsat log values plus satellite ephemeris. They will be transcribed with double-entry QA and stored in flight_observations with provenance — never estimated."
              required="Inmarsat data communication log (Malaysia, May 2014)"
            />
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Aircraft performance assumptions" />
            <CardBody className="space-y-3 text-xs">
              <label className="block"><span className="label">Scenario name</span>
                <input className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
              <label className="block"><span className="label">Navigation mode</span>
                <select className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={form.mode} onChange={(e) => set('mode', e.target.value)}>{MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block"><span className="label">Ground speed (kt)</span>
                  <input type="number" className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 mono text-slate-200" value={form.speedKt} onChange={(e) => set('speedKt', +e.target.value)} /></label>
                <label className="block"><span className="label">Altitude (ft)</span>
                  <input type="number" className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 mono text-slate-200" value={form.altitudeFt} onChange={(e) => set('altitudeFt', +e.target.value)} /></label>
              </div>
              <label className="block"><span className="label">Final major turn (UTC)</span>
                <input className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 mono text-slate-200" value={form.finalTurnUtc} onChange={(e) => set('finalTurnUtc', e.target.value)} /></label>
              <p className="text-[11px] text-slate-500">Default values are illustrative inputs, not findings.</p>
              <Button onClick={() => setScenarios((s) => [...s, { ...form, id: crypto.randomUUID() }])}>Save scenario</Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Scenario comparison" />
            <CardBody>
              {scenarios.length === 0 ? (
                <p className="text-xs text-slate-500">No scenarios saved.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="label text-left"><th className="pb-1">Name</th><th>Mode</th><th>kt</th><th>BTO fit</th></tr></thead>
                  <tbody>{scenarios.map((s) => (
                    <tr key={s.id} className="border-t border-ink-700"><td className="py-1.5 text-slate-200">{s.name}</td><td className="text-slate-400">{s.mode.split(' (')[0]}</td><td className="mono">{s.speedKt}</td><td className="text-pending">Not computed</td></tr>
                  ))}</tbody>
                </table>
              )}
              <p className="mt-2 text-[11px] text-slate-500">Fit scoring is enabled once BTO/BFO data is ingested (Phase 3). Saved scenarios are labelled "reconstructed scenario".</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
