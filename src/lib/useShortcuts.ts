import { useEffect, useRef } from 'react'

type Handlers = Record<string, (event: KeyboardEvent) => void>

/**
 * Single-key shortcuts (no modifiers). Ignored while typing in a field or while a
 * modal dialog is open, so "t" in a title never jumps the calendar to today.
 */
export function useShortcuts(handlers: Handlers): void {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('dialog[open]')) return
      const handler = ref.current[event.key] ?? ref.current[event.key.toLowerCase()]
      if (handler) {
        event.preventDefault()
        handler(event)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
