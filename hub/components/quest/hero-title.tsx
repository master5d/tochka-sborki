import { Fragment, type CSSProperties } from 'react'
import { splitTitle } from '../../lib/quest/hero-title'

/**
 * Cover motion: the hero line arrives word by word over the world. Pure CSS
 * (`.quest-title-word` in quest.css, gated behind prefers-reduced-motion:
 * no-preference) — no script, so the words are in the HTML from the first
 * paint and a reader without motion simply sees the line. Text comes only from
 * content.ts; this component never changes a word, only when each one lands.
 */
export function HeroTitle({ text }: { text: string }) {
  const words = splitTitle(text)
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="quest-title-word" style={{ '--d': `${w.delayMs}ms` } as CSSProperties}>{w.word}</span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}
