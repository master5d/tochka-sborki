import type { CSSProperties } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { GATE_PLAQUES, type PlaqueBox } from '../../lib/quest/scenes'
import { SceneLoop } from './scene-loop'

export function plaqueStyle(box: PlaqueBox): Pick<CSSProperties, 'left' | 'top' | 'width' | 'height'> {
  return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

interface Props { locale: Locale; plaques: [string, string]; caption?: string; loopCaption?: string; quip?: string }

/** Scene 05 with the two blank plaques lettered by code (the art itself has no text). */
export function GatePlaques({ locale, plaques, caption, loopCaption, quip }: Props) {
  return (
    <SceneLoop id="05-gates" locale={locale} caption={caption} loopCaption={loopCaption} quip={quip}>
      {GATE_PLAQUES.map((box, i) => (
        <span key={i} className="quest-plaque" style={plaqueStyle(box)} aria-hidden>
          {plaques[i]}
        </span>
      ))}
    </SceneLoop>
  )
}
