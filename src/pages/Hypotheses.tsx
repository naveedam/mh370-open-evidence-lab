import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EVIDENCE_AXES } from '@/data/hypotheses'
import { useData } from '@/lib/data'
import type { Hypothesis } from '@/types/evidence'

type Score = 'not assessed' | 'consistent' | 'neutral' | 'inconsistent'
const SCORE_STYLE: Record<Score, string> = { 'not assessed': 'text-slate-600', consistent: 'text-verified', neutral: 'text-slate-300', inconsistent: 'text-red-400' }

const List = ({ title, items }: { title: string; items: string[] }) => (
  <div><div className="label mb-1">{title}</div>{items.length ? <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-400">{items.map((i) => <li key={i}>{i}</li>)}</ul> : <p className="text-xs text-slate-600">None recorded</p>}</div>
)

export default function Hypotheses() {
  const { hypotheses: SEED_HYPOTHESES } = useData()
  const [hyps, setHyps] = useState<Hypothesis[]>(SEED_HYPOTHESES)
  useEffect(() => setHyps((cur) => [...SEED_HYPOTHESES, ...cur.filter((h) => h.origin === 'independent' && !SEED_HYPOTHESES.some((s) => s.id === h.id))]), [SEED_HYPOTHESES])
  const [sel, setSel] = useState(hyps[0].id)
  const [scores, setScores] = useState<Record<string, Score>>({})
  const [draft, setDraft] = useState({ title: '', description: '' })
  const h = hyps.find((x) => x.id === sel)!
  const add = () => {
    if (!draft.title.trim()) return
    const id = `H-${String(hyps.length + 1).padStart(3, '0')}`
    setHyps((x) => [...x, { id, ...draft, supportingEvidence: [], contradictingEvidence: [], assumptions: [], confidence: 'unassessed', dataDependencies: [], modelOutputs: [], status: 'proposed', origin: 'independent' }])
    setDraft({ title: '', description: '' })
    setSel(id)
  }
  return (
    <div>
      <PageHeader title="Hypothesis Laboratory" phase="Phase 4" subtitle="All hypotheses — published or independent — are tested against the same evidence. None is favoured by default." />
      <div className="grid grid-cols-[300px_1fr] gap-4 p-6">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Hypotheses" />
            <div className="p-2">{hyps.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={`w-full rounded px-2 py-2 text-left text-xs ${x.id === sel ? 'bg-ink-700 text-slate-100' : 'text-slate-400 hover:bg-ink-800'}`}>
                <span className="mono mr-2 text-slate-500">{x.id}</span>{x.title}
              </button>
            ))}</div>
          </Card>
          <Card>
            <CardHeader title="New hypothesis" />
            <CardBody className="space-y-2 text-xs">
              <input placeholder="Title" className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
              <textarea placeholder="Description" rows={3} className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              <Button onClick={add}>Create</Button>
            </CardBody>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title={`${h.id} · ${h.origin}`} right={<span className="text-[10px] uppercase tracking-wider text-slate-500">status: {h.status} · confidence: {h.confidence}</span>} />
            <CardBody className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-100">{h.title}</h2>
              <p className="text-xs text-slate-400">{h.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <List title="Supporting evidence" items={h.supportingEvidence} />
                <List title="Contradicting evidence" items={h.contradictingEvidence} />
                <List title="Required assumptions" items={h.assumptions} />
                <List title="Data dependencies" items={h.dataDependencies} />
                <List title="Model outputs" items={h.modelOutputs} />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Evidence comparison matrix" right={<span className="text-[10px] text-slate-500">manual assessment · each cell should cite a model run or source</span>} />
            <CardBody className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr><th className="label pb-2 text-left">Evidence axis</th>{hyps.map((x) => <th key={x.id} className="mono pb-2 text-left text-slate-400">{x.id}</th>)}</tr></thead>
                <tbody>{EVIDENCE_AXES.map((ax) => (
                  <tr key={ax} className="border-t border-ink-700">
                    <td className="py-1.5 text-slate-300">{ax}</td>
                    {hyps.map((x) => { const k = `${x.id}|${ax}`; const v = scores[k] ?? 'not assessed'; return (
                      <td key={k}><select className={`bg-transparent ${SCORE_STYLE[v]}`} value={v} onChange={(e) => setScores((s) => ({ ...s, [k]: e.target.value as Score }))}>{(Object.keys(SCORE_STYLE) as Score[]).map((o) => <option key={o} className="bg-ink-900 text-slate-200">{o}</option>)}</select></td>
                    ) })}
                  </tr>
                ))}</tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
