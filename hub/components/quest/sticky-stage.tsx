'use client'
import { useRef, type ReactNode } from 'react'
import { useActiveStep } from './use-active-step'

export interface StageStep { key: string; body: ReactNode }

interface Props {
  /** Render prop: receives the active step index so the media can switch its caption. */
  media: (active: number) => ReactNode
  steps: StageStep[]
}

/** Sticky scene on the left, scrolling steps on the right; stacked under 900px. */
export function StickyStage({ media, steps }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useActiveStep(ref, steps.length)
  return (
    <div className="quest-stage" ref={ref}>
      <div className="quest-stage__media">{media(active)}</div>
      <div className="quest-stage__steps">
        {steps.map((s, i) => (
          <div key={s.key} className="quest-stage__step" data-step={i} data-active={i === active ? 'true' : 'false'}>
            <div style={{ fontSize: 'var(--text-lg)', lineHeight: 1.65, color: 'var(--text-primary)', maxWidth: '36rem' }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
