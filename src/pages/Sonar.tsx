import { useRef, useState, type MouseEvent } from 'react'
import { Upload, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const CLASSES = ['Natural seabed formation', 'Metallic object', 'Aircraft-like structure', 'Debris cluster', 'Unidentified anomaly'] as const
interface Box { x: number; y: number; w: number; h: number }
interface Annotation { id: string; image: string; box: Box; label: (typeof CLASSES)[number]; confidence: 'low' | 'medium' | 'high'; annotator: string; note: string; review: 'queued' | 'confirmed' | 'disputed' }

export default function Sonar() {
  const [img, setImg] = useState<{ url: string; name: string; size: number } | null>(null)
  const [meta, setMeta] = useState({ lat: '', lon: '', survey: '', frequency: '', rangeM: '' })
  const [anns, setAnns] = useState<Annotation[]>([])
  const [draft, setDraft] = useState<Box | null>(null)
  const [label, setLabel] = useState<(typeof CLASSES)[number]>('Unidentified anomaly')
  const [confidence, setConfidence] = useState<Annotation['confidence']>('low')
  const [annotator, setAnnotator] = useState('')
  const start = useRef<{ x: number; y: number } | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  const rel = (e: MouseEvent) => { const r = stage.current!.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height } }
  const down = (e: MouseEvent) => { start.current = rel(e); setDraft({ ...start.current, w: 0, h: 0 }) }
  const move = (e: MouseEvent) => { if (!start.current) return; const p = rel(e); const s = start.current; setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) }) }
  const up = () => { start.current = null }
  const save = () => {
    if (!draft || draft.w < 0.005 || !img) return
    setAnns((a) => [...a, { id: crypto.randomUUID(), image: img.name, box: draft, label, confidence, annotator: annotator || 'anonymous', note: '', review: 'queued' }])
    setDraft(null)
  }
  return (
    <div>
      <PageHeader title="Sonar Intelligence" phase="Phase 4 · annotation workflow" subtitle="Manual annotation and human review of side-scan sonar imagery. No AI classifier is operational." />
      <div className="mx-6 mt-4 rounded border border-reconstructed/40 bg-reconstructed/10 px-3 py-2 text-xs text-reconstructed">
        AI inference status: <b>not available</b>. A model will only be enabled after training and validation against labelled sonar data, with published metrics.
      </div>
      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <Card>
          <CardHeader title="Image viewer" right={
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-signal/40 bg-signal/15 px-2.5 py-1 text-xs text-signal hover:bg-signal/25">
              <Upload className="h-3.5 w-3.5" /> Load image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImg({ url: URL.createObjectURL(f), name: f.name, size: f.size }) }} />
            </label>} />
          <CardBody>
            {!img ? (
              <div className="flex h-80 items-center justify-center rounded border border-dashed border-ink-600 text-xs text-slate-500">Load a side-scan sonar image (PNG/JPEG/TIFF preview) to annotate. Files stay in your browser in v0.1.</div>
            ) : (
              <div ref={stage} className="relative select-none" onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}>
                <img src={img.url} alt={img.name} className="w-full rounded grayscale" draggable={false} />
                {anns.filter((a) => a.image === img.name).map((a, i) => (
                  <div key={a.id} className="absolute border border-signal" style={{ left: `${a.box.x * 100}%`, top: `${a.box.y * 100}%`, width: `${a.box.w * 100}%`, height: `${a.box.h * 100}%` }}>
                    <span className="absolute -top-4 left-0 bg-ink-900 px-1 mono text-[10px] text-signal">#{i + 1}</span>
                  </div>
                ))}
                {draft && <div className="absolute border border-dashed border-reconstructed" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }} />}
              </div>
            )}
            {img && <p className="mt-2 mono text-[11px] text-slate-500">{img.name} · {(img.size / 1024).toFixed(0)} KB · drag to draw a box</p>}
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Image metadata" />
            <CardBody className="grid grid-cols-2 gap-2 text-xs">
              {([['lat', 'Latitude'], ['lon', 'Longitude'], ['survey', 'Survey / line ID'], ['frequency', 'Frequency (kHz)'], ['rangeM', 'Swath range (m)']] as const).map(([k, l]) => (
                <label key={k} className={k === 'survey' ? 'col-span-2' : ''}><span className="label">{l}</span>
                  <input className="mt-1 w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 mono text-slate-200" value={meta[k]} onChange={(e) => setMeta((m) => ({ ...m, [k]: e.target.value }))} /></label>
              ))}
              <p className="col-span-2 text-[11px] text-slate-500">Coordinates must come from the survey's navigation record.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Tag selection" />
            <CardBody className="space-y-2 text-xs">
              <select className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={label} onChange={(e) => setLabel(e.target.value as typeof label)}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select>
              <select className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={confidence} onChange={(e) => setConfidence(e.target.value as Annotation['confidence'])}><option value="low">Confidence: low</option><option value="medium">Confidence: medium</option><option value="high">Confidence: high</option></select>
              <input placeholder="Annotator initials" className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-slate-200" value={annotator} onChange={(e) => setAnnotator(e.target.value)} />
              <Button className="w-full" disabled={!draft} onClick={save}>Add to review queue</Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={`Human review queue (${anns.length})`} />
            <CardBody className="space-y-2">
              {anns.length === 0 && <p className="text-xs text-slate-500">No annotations.</p>}
              {anns.map((a, i) => (
                <div key={a.id} className="rounded border border-ink-700 p-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-200">#{i + 1} {a.label}</span><button onClick={() => setAnns((x) => x.filter((y) => y.id !== a.id))}><Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" /></button></div>
                  <div className="text-slate-500">{a.confidence} · {a.annotator} · {a.image}</div>
                  <div className="mt-1 flex gap-1">{(['queued', 'confirmed', 'disputed'] as const).map((r) => <Button key={r} size="sm" variant={a.review === r ? 'active' : 'ghost'} onClick={() => setAnns((x) => x.map((y) => (y.id === a.id ? { ...y, review: r } : y)))}>{r}</Button>)}</div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
