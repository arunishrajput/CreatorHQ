import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from './Button'

interface DialogProps {
  open: boolean
  onClose(): void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Native <dialog> in modal mode: the browser handles focus trapping, Esc, and
 * inert background for us. A click on the backdrop closes it.
 */
export function Dialog({ open, onClose, title, children, footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={cn(
        'm-auto w-[min(92vw,480px)] rounded-xl border border-line bg-surface p-0 text-fg shadow-2xl shadow-black/60',
        'open:animate-pop-in',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="truncate text-[13px] font-medium text-fg">{title}</h2>
            <IconButton label="Close" onClick={onClose}>
              <X size={15} />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          {footer && <footer className="flex items-center gap-2 border-t border-line px-4 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
