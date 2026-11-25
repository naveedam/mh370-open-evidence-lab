import { ExternalLink, MapPin, X } from 'lucide-react'
import type { FeatureProps } from '@/types/evidence'
import { ClassBadge } from '@/components/ui/badge'

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 border-b border-ink-700/60 py-2 text-xs">
      <span className="label pt-0.5">{k}</span>
      <span className="text-slate-300">{v || <span className="text-slate-600">Not recorded</span>}</span>
    </div>
  )
}

export function ProvenancePanel({ feature, onClose }: { feature: FeatureProps | null; onClose: () => void }) {
  if (!feature)
    return (
      <div className="p-4 text-xs text-slate-500">
        <MapPin className="mb-2 h-4 w-4" />
        Select a map feature to inspect its source, date, accuracy, confidence and provenance.
      </div>
    )
  return (
    <div className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <ClassBadge value={feature.evidenceClass} />
          <h3 className="mt-2 text-sm font-semibold text-slate-100">{feature.name}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="h-4 w-4" /></button>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-400">{feature.description}</p>
      {feature.coverageClass && <Row k="Coverage class" v={feature.coverageClass.replace(/_/g, ' ')} />}
      <Row k="Date" v={feature.date} />
      <Row k="Source" v={feature.source} />
      <Row k="Published" v={feature.publicationDate} />
      <Row k="Spatial accuracy" v={feature.spatialAccuracy} />
      <Row k="Confidence" v={feature.confidence} />
      <Row k="Methodology" v={feature.methodology} />
      <Row k="Verification" v={feature.verificationNote} />
      <Row k="Feature ID" v={feature.id} />
      {feature.sourceUrl && (
        <a href={feature.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-signal hover:underline">
          Open source <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}
