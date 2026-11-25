import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { EvidenceClass } from '@/types/evidence'

const CLASS_STYLE: Record<EvidenceClass, { label: string; cls: string }> = {
  verified_observation: { label: 'Verified observation', cls: 'text-verified border-verified/40 bg-verified/10' },
  published_interpretation: { label: 'Published interpretation', cls: 'text-published border-published/40 bg-published/10' },
  reconstructed_scenario: { label: 'Reconstructed scenario', cls: 'text-reconstructed border-reconstructed/40 bg-reconstructed/10' },
  experimental_model: { label: 'Experimental model output', cls: 'text-model border-model/40 bg-model/10' },
  pending: { label: 'Data pending', cls: 'text-pending border-pending/40 bg-pending/10' },
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider', className)}>
      {children}
    </span>
  )
}

export function ClassBadge({ value }: { value: EvidenceClass }) {
  const s = CLASS_STYLE[value]
  return <Badge className={s.cls}>{s.label}</Badge>
}

export const CLASS_COLORS: Record<EvidenceClass, string> = {
  verified_observation: '#5fb98a',
  published_interpretation: '#5b9bd5',
  reconstructed_scenario: '#d6a64a',
  experimental_model: '#c46ad6',
  pending: '#7b8796',
}
