import { useState } from 'react'
import { Clapperboard } from 'lucide-react'
import { cn } from '@/lib/cn'

/** 16:9 thumbnail that degrades to a placeholder if the image is missing or fails to load. */
export function Thumbnail({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={cn('relative aspect-video shrink-0 overflow-hidden rounded bg-raised', className)}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-fg-subtle">
          <Clapperboard size={12} />
        </div>
      )}
    </div>
  )
}
