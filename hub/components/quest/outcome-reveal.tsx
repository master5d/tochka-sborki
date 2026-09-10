'use client'
import { useEffect, useRef, useState } from 'react'
import type { Outcome, QuestContent } from '../../lib/quest/content'
import { GUIDE_ASSETS } from '../../lib/quest/scenes'
import { GuideChip } from './guide-chip'

interface Props { title: string; outcomes: [Outcome, Outcome]; labels: QuestContent['labels'] }

/**
 * Wave I: the outcomes act, common to all three forks — its own full-width
 * band (the fork's own tint, already the section background — no new
 * surface), echoing the chapter opener exactly: the canon `outcomesTitle`
 * centred and large, a guide medallion each side, same `.quest-opener`
 * classes reused rather than reinvented. Two stat cards stay underneath,
 * unchanged. Visible at rest; when JS runs and motion is allowed the block is
 * "armed" (hidden) and revealed once it enters the viewport.
 */
export function OutcomeReveal({ title, outcomes, labels }: Props) {
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
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`quest-outcomes-act quest-reveal${inView ? ' is-in' : ''}`} data-armed={armed ? '' : undefined}>
      <div className="quest-opener quest-outcomes-act__row">
        <img className="quest-opener__guide" src={GUIDE_ASSETS.scroller} alt="" width={112} height={112} loading="lazy" />
        <h3 className="quest-opener__title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)' }}>{title}</h3>
        <img className="quest-opener__guide quest-opener__guide--right" src={GUIDE_ASSETS.builder} alt="" width={112} height={112} loading="lazy" />
      </div>
      <div className="quest-cards">
        {outcomes.map((o) => (
          <article key={o.guide} className="quest-card">
            <GuideChip guide={o.guide} label={o.guide === 'scroller' ? labels.habit : labels.detour} />
            {o.text.includes(o.value) ? null : <div className="quest-number">{o.value}</div>}
            <p className="quest-prose" style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, color: 'var(--text-primary)' }}>{o.text}</p>
            {o.source ? <div className="quest-source">{o.source}</div> : null}
          </article>
        ))}
      </div>
    </div>
  )
}
