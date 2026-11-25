import { Fragment, useMemo, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/lib/data'
import { downloadJson } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { DatasetRecord } from '@/types/evidence'

const ACCESS_STYLE: Record<DatasetRecord['access'], string> = {
  'open-download': 'text-verified border-verified/40', 'open-viewer-only': 'text-published border-published/40', 'reports-only': 'text-published border-published/40', restricted: 'text-red-400 border-red-400/40', unverified: 'text-pending border-pending/40',
}

export default function Evidence() {
  const { datasets: DATASETS } = useData()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('all')
  const [access, setAccess] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  const tags = useMemo(() => ['all', ...new Set(DATASETS.flatMap((d) => d.tags))], [DATASETS])
  const rows = DATASETS.filter((d) => (tag === 'all' || d.tags.includes(tag)) && (access === 'all' || d.access === access) && `${d.name} ${d.organisation} ${d.coverage}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <PageHeader title="Evidence Repository" subtitle="Catalogue of sources and datasets. Access levels are assessments — a link does not guarantee downloadable raw data." right={<Button variant="outline" size="sm" onClick={() => downloadJson('mh370-oel-catalogue.json', DATASETS)}>Export catalogue</Button>} />
      <div className="flex items-center gap-2 px-6 pt-4">
        <div className="relative flex-1"><Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-500" />
          <input placeholder="Search datasets, organisations, coverage…" className="w-full rounded border border-ink-600 bg-ink-850 py-1.5 pl-7 pr-2 text-xs text-slate-200" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-xs" value={tag} onChange={(e) => setTag(e.target.value)}>{tags.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-xs" value={access} onChange={(e) => setAccess(e.target.value)}>{['all', 'open-download', 'open-viewer-only', 'reports-only', 'restricted', 'unverified'].map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div className="p-6">
        <Card className="overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-ink-850"><tr className="label text-left">{['Dataset', 'Organisation', 'Published', 'Format', 'Access', 'Status', ''].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((d) => (
                <Fragment key={d.id}>
                  <tr className="cursor-pointer border-t border-ink-700 hover:bg-ink-850" onClick={() => setOpen(open === d.id ? null : d.id)}>
                    <td className="px-3 py-2 text-slate-200">{d.name}</td>
                    <td className="px-3 text-slate-400">{d.organisation}</td>
                    <td className="px-3 mono text-slate-400">{d.publicationDate ?? '—'}</td>
                    <td className="px-3 text-slate-400">{d.format}</td>
                    <td className="px-3"><Badge className={ACCESS_STYLE[d.access]}>{d.access}</Badge></td>
                    <td className="px-3 text-slate-400">{d.ingestionStatus}</td>
                    <td className="px-3"><a href={d.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-signal"><ExternalLink className="h-3.5 w-3.5" /></a></td>
                  </tr>
                  {open === d.id && (
                    <tr className="bg-ink-850"><td colSpan={7} className="px-3 py-3">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        {([['Coverage', d.coverage], ['Licensing', d.licensing], ['Quality assessment', d.quality], ['Acquisition date', d.acquisitionDate ?? 'Not acquired'], ['Processing history', d.processingHistory.join('; ') || 'None'], ['Source URL', d.url]] as const).map(([k, v]) => (
                          <div key={k}><div className="label">{k}</div><div className="mt-0.5 break-all text-slate-300">{v}</div></div>
                        ))}
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">No datasets match.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
