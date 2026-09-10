'use client'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useActiveStep } from './use-active-step'
import { lagPan, useChapterProgress } from './use-chapter-progress'

export interface StageStep { key: string; body: ReactNode }

interface Props {
  /** Render prop: receives the active step index (also used to dim inactive steps). */
  media: (active: number) => ReactNode
  steps: StageStep[]
  /** Wave I: `#temple`'s real mirror of `#boulder` — sticky world on the RIGHT,
   *  steps on the LEFT (≥900px only; below that both chapters are already one
   *  column in the same DOM order). */
  mirror?: boolean
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

/**
 * Sticky scene on the left, scrolling steps on the right; stacked under 900px.
 * `ref` spans the WHOLE stage — steps AND anything a caller appends after them
 * (a fork's CTA + bridge paragraph are passed in as a trailing step, not rendered
 * outside this grid) — so the sticky media's containing block never runs out
 * before the chapter's content does (see the Wave A/B "world disappears mid-chapter"
 * finding). `useChapterProgress` reads that same box to drive `--pan`, which the
 * scene's CSS turns into `object-position` panning; `prefers-reduced-motion` pins
 * the pan at 0.33 instead of following scroll. Wave J1: raw scroll progress is run
 * through `lagPan` first — the world's own pan lags the reader at ~0.6 for most of
 * the chapter (the depth cue: the art moves slower than the text column scrolls
 * past it), then catches up over the last stretch so the frame is still fully
 * traversed by the chapter's end.
 */
export function StickyStage({ media, steps, mirror = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useActiveStep(ref, steps.length)
  const scrollProgress = useChapterProgress(ref)
  const reducedMotion = useReducedMotion()
  const pan = reducedMotion ? 0.33 : lagPan(scrollProgress)
  return (
    <div className={mirror ? 'quest-stage quest-stage--mirror' : 'quest-stage'} ref={ref} style={{ '--pan': pan } as CSSProperties}>
      <div className="quest-stage__media">{media(active)}</div>
      <div className="quest-stage__steps">
        {steps.map((s, i) => (
          <div key={s.key} className="quest-stage__step" data-step={i} data-active={i === active ? 'true' : 'false'}>
            <div className="quest-prose" style={{ fontSize: 'var(--text-lg)', lineHeight: 1.65, color: 'var(--text-primary)' }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
