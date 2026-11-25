import { useState } from 'react'
import { ResearchMap } from '@/components/map/ResearchMap'
import { LayerPanel } from '@/components/LayerPanel'
import { ProvenancePanel } from '@/components/ProvenancePanel'
import { LAYERS } from '@/data/layers'
import type { FeatureProps } from '@/types/evidence'

export default function Explorer() {
  const [visible, setVisible] = useState(() => new Set(LAYERS.filter((l) => l.defaultVisible).map((l) => l.id)))
  const [selected, setSelected] = useState<FeatureProps | null>(null)
  const toggle = (id: string) =>
    setVisible((v) => {
      const n = new Set(v)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  return (
    <div className="grid h-full grid-cols-[270px_1fr_320px]">
      <div className="overflow-y-auto border-r border-ink-700 bg-ink-900">
        <div className="border-b border-ink-700 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-200">Data layers</div>
        <LayerPanel visible={visible} toggle={toggle} />
      </div>
      <div className="relative min-h-[500px]">
        <ResearchMap visible={visible} onSelect={setSelected} selectedId={selected?.id} />
        <div className="pointer-events-none absolute bottom-10 left-3 max-w-sm rounded border border-ink-600 bg-ink-900/90 px-3 py-2 text-[11px] text-slate-400">
          The 7th arc is a satellite-derived constraint on position at ~00:19 UTC — not an aircraft location.
        </div>
      </div>
      <div className="overflow-y-auto border-l border-ink-700 bg-ink-900">
        <div className="border-b border-ink-700 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-200">Feature provenance</div>
        <ProvenancePanel feature={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  )
}
