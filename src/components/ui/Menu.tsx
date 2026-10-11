import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface MenuProps {
  trigger: (props: { open: boolean; toggle(): void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
}

/** Minimal dropdown: closes on outside click and Esc. */
export function Menu({ trigger, children, align = 'right' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-30 mt-1 min-w-56 animate-pop-in rounded-lg border border-line bg-raised p-1 shadow-xl shadow-black/50',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onSelect,
  danger,
}: {
  children: ReactNode
  onSelect(): void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors hover:bg-hover',
        danger ? 'text-danger' : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />
}
