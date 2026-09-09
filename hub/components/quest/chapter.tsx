import type { ReactNode } from 'react'

export type Tint = 'hero' | 'intro' | 'fork1' | 'fork2' | 'fork3' | 'finale' | 'about'

interface Props {
  id: string
  tint: Tint
  eyebrow?: string
  heading?: string
  children: ReactNode
}

/** One chapter of the quest: tinted full-width band, content capped at --content-max. */
export function Chapter({ id, tint, eyebrow, heading, children }: Props) {
  return (
    <section id={id} className="hub-section" style={{ background: `var(--quest-tint-${tint})`, padding: 'var(--section-gap) 2rem', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        {eyebrow ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
            {eyebrow}
          </div>
        ) : null}
        {heading ? (
          <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '2rem', textWrap: 'balance' }}>
            {heading}
          </h2>
        ) : null}
        {children}
      </div>
    </section>
  )
}
