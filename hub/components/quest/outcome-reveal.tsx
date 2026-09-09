'use client'
import { useEffect, useRef, useState } from 'react'
import type { Outcome, QuestContent } from '../../lib/quest/content'
import { GuideChip } from './guide-chip'

interface Props { title: string; outcomes: [Outcome, Outcome]; labels: QuestContent['labels'] }

/**
 * Two stat cards. Visible at rest; when JS runs and motion is allowed the block is
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
    <div ref={ref} className={`quest-reveal${inView ? ' is-in' : ''}`} data-armed={armed ? '' : undefined}>
      <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>{title}</h3>
      <div className="quest-cards">
        {outcomes.map((o) => (
          <article key={o.guide} className="quest-card">
            <GuideChip guide={o.guide} label={o.guide === 'scroller' ? labels.habit : labels.detour} />
            <div className="quest-number">{o.value}</div>
            <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, color: 'var(--text-primary)' }}>{o.text}</p>
            {o.source ? <div className="quest-source">{o.source}</div> : null}
          </article>
        ))}
      </div>
    </div>
  )
}
