import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, CircleDashed } from 'lucide-react'
import { LAYER_GROUPS } from '@/data/layers'
import { useData } from '@/lib/data'
import { CLASS_COLORS } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function LayerPanel({ visible, toggle }: { visible: Set<string>; toggle: (id: string) => void }) {
  const { layers: LAYERS } = useData()
  const [open, setOpen] = useState<Record<string, boolean>>(Object.fromEntries(LAYER_GROUPS.map((g) => [g, true])))
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <div className="text-xs">
      {LAYER_GROUPS.map((g) => (
        <div key={g} className="border-b border-ink-700">
          <button className="flex w-full items-center gap-1.5 px-3 py-2 text-left label hover:text-slate-300" onClick={() => setOpen((o) => ({ ...o, [g]: !o[g] }))}>
            {open[g] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} {g}
          </button>
          {open[g] &&
            LAYERS.filter((l) => l.group === g).map((l) => {
              const pending = !l.data && !l.tiles
              const on = visible.has(l.id)
              return (
                <div key={l.id} className="px-3 pb-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pending}
                      onClick={() => toggle(l.id)}
                      className={cn('flex flex-1 items-center gap-2 rounded px-1.5 py-1 text-left', pending ? 'text-slate-600' : on ? 'text-slate-100' : 'text-slate-400 hover:bg-ink-800')}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: pending ? 'transparent' : CLASS_COLORS[l.evidenceClass], border: `1px solid ${CLASS_COLORS[l.evidenceClass]}` }} />
                      <span className="flex-1">{l.name}</span>
                      {pending ? <CircleDashed className="h-3.5 w-3.5" /> : on ? <Eye className="h-3.5 w-3.5 text-signal" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    {pending && (
                      <button className="text-[10px] uppercase tracking-wider text-pending hover:text-slate-300" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                        pending
                      </button>
                    )}
                  </div>
                  {pending && expanded === l.id && l.pending && (
                    <div className="ml-6 mt-1 rounded border border-ink-700 bg-ink-850 p-2 text-[11px] leading-relaxed text-slate-400">
                      {l.pending.reason}
                      <div className="mt-1 text-slate-500">
                        <span className="label mr-1">Needs</span>
                        {l.pending.sourceUrl ? <a className="text-signal hover:underline" href={l.pending.sourceUrl} target="_blank" rel="noreferrer">{l.pending.requiredSource}</a> : l.pending.requiredSource}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      ))}
      <div className="space-y-1 p-3">
        <div className="label mb-1">Evidence classes</div>
        {(
          [
            ['verified_observation', 'Verified observation'],
            ['published_interpretation', 'Published interpretation'],
            ['reconstructed_scenario', 'Reconstructed scenario'],
            ['experimental_model', 'Experimental model'],
            ['pending', 'Data pending'],
          ] as const
        ).map(([k, n]) => (
          <div key={k} className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: CLASS_COLORS[k] }} /> {n}
          </div>
        ))}
      </div>
    </div>
  )
}
