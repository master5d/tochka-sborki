import type { ReactNode } from 'react'
import { GUIDE_ASSETS } from '../../lib/quest/scenes'

export type Tint = 'hero' | 'intro' | 'fork1' | 'fork2' | 'fork3' | 'finale' | 'about'

interface Props {
  id: string
  tint: Tint
  eyebrow?: string
  heading?: string
  /**
   * Full-bleed band (A1): drops the horizontal padding on the band's inner
   * container so a child — the sticky stage's media column — can run to the
   * viewport edge on wide screens. Eyebrow/heading still cap themselves at
   * --content-max so they don't stretch edge to edge; callers must do the
   * same for any content they place after the bleeding child.
   */
  bleed?: boolean
  /**
   * Wave H (H2): a chapter change as an EVENT rather than a small left-aligned
   * eyebrow+heading — used by the three forks, where a new obstacle really is
   * a turn in the story. The tint (already the section's own background — no
   * new surface, no new contrast pair) fills the width, eyebrow+heading sit
   * centred and large, and the two guides bracket the title as circular
   * cut-outs — what keeps them feeling present "all the way down" the page,
   * not just in the scene art. No new copy: eyebrow/heading are still exactly
   * `fork.eyebrow`/`fork.obstacle` from content.ts. Below 720px the row
   * collapses to the title plus the LEFT (Scroller) medallion only — two
   * medallions plus a large title no longer fit one mobile screen without
   * either shrinking to illegible or pushing the chapter's own art off the
   * first screen.
   */
  guides?: boolean
  children: ReactNode
}

/** One chapter of the quest: tinted full-width band, content capped at --content-max. */
export function Chapter({ id, tint, eyebrow, heading, children, bleed = false, guides = false }: Props) {
  const capStyle = { maxWidth: 'var(--content-max)', margin: '0 auto', padding: bleed ? '0 2rem' : undefined }
  // A backdrop-style bleed chapter (no eyebrow/heading of its own, e.g. the hero) also
  // drops the section's TOP padding: the art must start right under the sticky
  // header, not 5rem of tinted padding above it. Chapters with a heading keep the
  // top rhythm — only their horizontal padding is dropped for the sticky stage.
  const vPadTop = bleed && !eyebrow && !heading ? '0' : 'var(--section-gap)'
  // Wave G (G3): every bleed chapter's own bottom padding used to be the SAME
  // flat section-gap slab, rendered in the chapter's tint with nothing in it —
  // the sticky world has already fully unpinned by the time scroll reaches it
  // (the stage's own trailing step padding, `.quest-stage__steps`'s 18vh, is
  // what actually gives the last step room to breathe), so that slab read as
  // "the art stopped, here's a band of empty tint" right before the next
  // chapter (sharpest on the finale, whose neighbour — About — isn't itself a
  // sticky-stage chapter and stacks its OWN top padding on top of it). Dropped
  // for every bleed chapter, not just the finale, since the cause is the same
  // shape everywhere it occurs.
  const vPadBottom = bleed ? '0' : 'var(--section-gap)'
  return (
    <section id={id} className="hub-section" style={{ background: `var(--quest-tint-${tint})`, padding: `${vPadTop} ${bleed ? '0' : '2rem'} ${vPadBottom}`, borderTop: '1px solid var(--border-color)' }}>
      <div style={bleed ? undefined : { maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        {guides ? (
          <div className="quest-opener" style={capStyle}>
            <img className="quest-opener__guide" src={GUIDE_ASSETS.scroller} alt="" width={112} height={112} loading="lazy" />
            <div className="quest-opener__text">
              {eyebrow ? <div className="quest-opener__eyebrow">{eyebrow}</div> : null}
              {heading ? <h2 className="quest-opener__title">{heading}</h2> : null}
            </div>
            <img className="quest-opener__guide quest-opener__guide--right" src={GUIDE_ASSETS.builder} alt="" width={112} height={112} loading="lazy" />
          </div>
        ) : (
          <>
            {eyebrow ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem', ...capStyle }}>
                {eyebrow}
              </div>
            ) : null}
            {heading ? (
              <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '2rem', textWrap: 'balance', ...capStyle }}>
                {heading}
              </h2>
            ) : null}
          </>
        )}
        {children}
      </div>
    </section>
  )
}
