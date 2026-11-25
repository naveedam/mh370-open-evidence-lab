import type { ReactNode } from 'react'
export function PageHeader({ title, subtitle, right, phase }: { title: string; subtitle: string; right?: ReactNode; phase?: string }) {
  return (
    <div className="flex items-end justify-between border-b border-ink-700 px-6 py-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-slate-100">{title}</h1>
          {phase && <span className="rounded border border-ink-600 px-1.5 py-0.5 mono text-[10px] text-slate-500">{phase}</span>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      {right}
    </div>
  )
}
