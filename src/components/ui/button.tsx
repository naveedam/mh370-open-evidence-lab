import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal',
  {
    variants: {
      variant: {
        default: 'bg-signal/15 text-signal border border-signal/40 hover:bg-signal/25',
        ghost: 'text-slate-400 hover:text-slate-100 hover:bg-ink-700',
        outline: 'border border-ink-600 text-slate-300 hover:bg-ink-700',
        active: 'bg-ink-700 text-slate-100 border border-ink-500',
      },
      size: { sm: 'h-7 px-2.5', md: 'h-8 px-3', icon: 'h-7 w-7' },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
