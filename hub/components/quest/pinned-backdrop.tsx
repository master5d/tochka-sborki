'use client'
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { lagPan, useChapterProgress } from './use-chapter-progress'
import { useReducedMotion } from './use-parallax'

interface Props {
  /** The chapter's scene (a `SceneLoop`), pinned full-bleed behind the copy. */
  scene: ReactNode
  /** One entry per panel; each scrolls past the pinned world on its own opaque surface. */
  panels: ReactNode[]
}

/**
 * Wave L1: `#intro`'s composition. The audit found the chapter's middle was a
 * whole screen of text on flat tint (the world vanished once the old top band
 * scrolled away). Here the scene is pinned full-bleed for the WHOLE chapter and
 * the paragraphs travel over it, each on its own `--quest-tint-intro` panel (a
 * token surface already asserted readable in contrast.test.ts — text never sits
 * on the art itself). The art pans with the same lagged progress as the sticky
 * stage (`lagPan`), pinned at 0.33 under reduced motion.
 */
export function PinnedBackdrop({ scene, panels }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const progress = useChapterProgress(ref)
  const reducedMotion = useReducedMotion()
  const pan = reducedMotion ? 0.33 : lagPan(progress)
  return (
    <div className="quest-backdrop" ref={ref} style={{ '--pan': pan } as CSSProperties}>
      <div className="quest-backdrop__scene">{scene}</div>
      <div className="quest-backdrop__copy">
        {panels.map((panel, i) => <div key={i} className="quest-backdrop__panel">{panel}</div>)}
      </div>
    </div>
  )
}
