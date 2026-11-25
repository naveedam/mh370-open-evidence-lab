import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('panel', className)} {...p} />
}

export function CardHeader({ title, icon, right, className }: { title: string; icon?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-ink-700 px-4 py-2.5', className)}>
      <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold tracking-wide uppercase">
        {icon}
        {title}
      </div>
      {right}
    </div>
  )
}

export function CardBody({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...p} />
}
