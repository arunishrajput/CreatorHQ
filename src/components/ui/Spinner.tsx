import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block size-3.5 animate-spin rounded-full border-2 border-fg-subtle border-t-fg', className)}
    />
  )
}
