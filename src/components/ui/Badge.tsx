import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Dot({ className }: { className: string }) {
  return <span aria-hidden className={cn('inline-block size-1.5 shrink-0 rounded-full', className)} />
}

/** A dot plus a label — the only way status/stage colour is shown, so colour is never the sole signal. */
export function Badge({ dot, children }: { dot: string; children: ReactNode }) {
  return (
    <span className="inline-flex h-5 items-center gap-1.5 rounded-full border border-line bg-raised px-2 text-[11px] font-medium text-fg-muted">
      <Dot className={dot} />
      {children}
    </span>
  )
}
