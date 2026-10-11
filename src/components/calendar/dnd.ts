import { useState, type DragEvent } from 'react'
import type { DayKey, PlannedVideo } from '@/core/types'
import { usePlanned } from '@/state/planned'

/**
 * Drag-and-drop for rescheduling planned videos, on native HTML5 DnD.
 * A custom MIME type means only our chips are accepted as drops — not text or files.
 */
const MIME = 'application/x-creatorhq-planned'

export function plannedDragProps(video: PlannedVideo) {
  return {
    draggable: true,
    onDragStart(event: DragEvent) {
      event.dataTransfer.setData(MIME, video.id)
      event.dataTransfer.effectAllowed = 'move'
    },
  }
}

export function useDropTarget(day: DayKey) {
  const [isOver, setIsOver] = useState(false)
  const move = usePlanned((s) => s.move)

  const accepts = (event: DragEvent) => event.dataTransfer.types.includes(MIME)

  return {
    isOver,
    dropProps: {
      onDragOver(event: DragEvent) {
        if (!accepts(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (!isOver) setIsOver(true)
      },
      onDragLeave(event: DragEvent) {
        // Ignore leave events fired when moving between the cell's own children.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setIsOver(false)
      },
      onDrop(event: DragEvent) {
        setIsOver(false)
        const id = event.dataTransfer.getData(MIME)
        if (!id) return
        event.preventDefault()
        void move(id, day)
      },
    },
  }
}
