import type { ReactNode } from 'react'
import { DatabaseZap } from 'lucide-react'

export function EmptyState({ title, reason, required, href, icon }: { title: string; reason: string; required?: string; href?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-ink-600 bg-ink-850 p-4">
      <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
        {icon ?? <DatabaseZap className="h-4 w-4 text-pending" />} {title}
      </div>
      <p className="text-xs leading-relaxed text-slate-400">{reason}</p>
      {required && (
        <p className="text-[11px] text-slate-500">
          <span className="label mr-1">Required</span>
          {href ? <a className="text-signal hover:underline" href={href} target="_blank" rel="noreferrer">{required}</a> : required}
        </p>
      )}
    </div>
  )
}
