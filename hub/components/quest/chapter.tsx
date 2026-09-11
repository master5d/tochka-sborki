'use client'
import { useRef, type ReactNode } from 'react'
import { GUIDE_ASSETS } from '../../lib/quest/scenes'
import { clampProgress } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

/** Wave J1 (item 3): the opener's guide medallions drift a small amount toward
 * their own edge (left guide left, right guide right) as the opener enters and
 * leaves the viewport — one shared registration in the page's parallax loop
 * per opener, reading the opener row's own transit (`clampProgress`, the same
 * math `useChapterProgress` uses) and writing `--px-x` straight onto each
 * guide `<img>`. Capped well under the ~40px spec ceiling. `enabled` is false
 * for every non-opener chapter (skips registering entirely) and for reduced
 * motion (checked once, shared across all openers via `useReducedMotion`). */
function useMedallionDrift(enabled: boolean, amplitude = 32) {
  const openerRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLImageElement>(null)
  const rightRef = useRef<HTMLImageElement>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const opener = openerRef.current
    if (!opener) return
    const rect = opener.getBoundingClientRect()
    const progress = clampProgress(rect.top, rect.height, window.innerHeight)
    const shift = amplitude * progress
    leftRef.current?.style.setProperty('--px-x', `${-shift}px`)
    rightRef.current?.style.setProperty('--px-x', `${shift}px`)
  }, enabled && !reducedMotion)
  return { openerRef, leftRef, rightRef }
}

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
  /** Wave M: paint the band with this value instead of the chapter tint (#about's saturated band). */
  surface?: string
  children: ReactNode
}

/** One chapter of the quest: tinted full-width band, content capped at --content-max. */
export function Chapter({ id, tint, eyebrow, heading, children, bleed = false, guides = false, surface }: Props) {
  const { openerRef, leftRef, rightRef } = useMedallionDrift(guides)
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
    <section id={id} className={bleed ? 'hub-section quest-bleed' : 'hub-section'} style={{ background: surface ?? `var(--quest-tint-${tint})`, padding: `${vPadTop} ${bleed ? '0' : '2rem'} ${vPadBottom}`, borderTop: '1px solid var(--border-color)' }}>
      <div style={bleed ? undefined : { maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        {guides ? (
          <div className="quest-opener" style={capStyle} ref={openerRef}>
            <img ref={leftRef} className="quest-opener__guide" src={GUIDE_ASSETS.scroller} alt="" width={112} height={112} loading="lazy" />
            <div className="quest-opener__text">
              {eyebrow ? <div className="quest-opener__eyebrow">{eyebrow}</div> : null}
              {heading ? <h2 className="quest-opener__title">{heading}</h2> : null}
            </div>
            <img ref={rightRef} className="quest-opener__guide quest-opener__guide--right" src={GUIDE_ASSETS.builder} alt="" width={112} height={112} loading="lazy" />
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
