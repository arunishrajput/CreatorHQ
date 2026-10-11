import { cn } from '@/lib/cn'

interface SegmentedProps<T extends string> {
  value: T
  options: readonly { value: T; label: string; hint?: string }[]
  onChange(value: T): void
  label: string
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-7 rounded-md border border-line bg-surface p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          title={option.hint}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[5px] px-2.5 text-[12px] font-medium transition-colors',
            option.value === value ? 'bg-hover text-fg shadow-sm' : 'text-fg-subtle hover:text-fg-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
