'use client'
import { useEffect, useRef, useState } from 'react'
import type { Outcome, QuestContent } from '../../lib/quest/content'
import type { PathMark } from '../../lib/quest/route'
import { GUIDE_ASSETS, OUTCOME_ART_SIZE, outcomeArt, type ForkId } from '../../lib/quest/scenes'
import { GuideChip } from './guide-chip'
import { ThemedPicture } from './themed-picture'

interface Props {
  forkId: ForkId
  title: string
  outcomes: [Outcome, Outcome]
  labels: QuestContent['labels']
  /** The reader's mark for this fork, if any — that road's outcome gets a ring. */
  chosen?: PathMark
}

/**
 * The outcomes act, common to all three forks. L2: the reference's "Outcomes"
 * strip — a saturated full-width band in the fork's own hue (`--quest-band-*`),
 * the canon `outcomesTitle` between the two guide medallions, then the two
 * roads' outcomes side by side as tall illustrations (`outcomeArt`), each with
 * its own stat card underneath — text straight from content.ts, untouched.
 * When the reader has marked a road at this fork, that road's outcome wears a
 * ring; with no mark both stand equal. The art is decorative (`alt=""`): the
 * card under it carries the meaning. Visible at rest; when JS runs and motion
 * is allowed the block is "armed" (hidden) and revealed on entering the viewport.
 */
export function OutcomeReveal({ forkId, title, outcomes, labels, chosen }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) return // already on screen: never hide what the reader sees
    setArmed(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`quest-outcomes-act quest-outcomes-act--${forkId} quest-reveal${inView ? ' is-in' : ''}`}
      data-armed={armed ? '' : undefined}
    >
      <div className="quest-opener quest-outcomes-act__row">
        <img className="quest-opener__guide" src={GUIDE_ASSETS.scroller} alt="" width={112} height={112} loading="lazy" />
        <h3 className="quest-opener__title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)' }}>{title}</h3>
        <img className="quest-opener__guide quest-opener__guide--right" src={GUIDE_ASSETS.builder} alt="" width={112} height={112} loading="lazy" />
      </div>
      <div className="quest-outcomes">
        {outcomes.map((o) => {
          const mark: PathMark = o.guide === 'scroller' ? 'habit' : 'detour'
          return (
            <figure key={o.guide} className="quest-outcome" data-chosen={chosen === mark ? 'true' : undefined}>
              <ThemedPicture
                className="quest-outcome__art"
                day={outcomeArt(forkId, o.guide, 'day')}
                night={outcomeArt(forkId, o.guide, 'night')}
                width={OUTCOME_ART_SIZE.width}
                height={OUTCOME_ART_SIZE.height}
                alt=""
              />
              <figcaption className="quest-card quest-outcome__card">
                <GuideChip guide={o.guide} label={o.guide === 'scroller' ? labels.habit : labels.detour} />
                {o.text.includes(o.value) ? null : <div className="quest-number">{o.value}</div>}
                <p className="quest-prose" style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, color: 'var(--text-primary)' }}>{o.text}</p>
                {o.source ? <div className="quest-source">{o.source}</div> : null}
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
