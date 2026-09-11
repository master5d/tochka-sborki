import type { CSSProperties } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { GATE_PLAQUES, type PlaqueBox } from '../../lib/quest/scenes'
import { DetourCurtain } from './detour-curtain'
import { SceneLoop } from './scene-loop'

export function plaqueStyle(box: PlaqueBox): Pick<CSSProperties, 'left' | 'top' | 'width' | 'height'> {
  return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

interface Props { locale: Locale; plaques: [string, string]; quip?: string }

/**
 * Scene 05 with the two blank plaques lettered by code (the art itself has no text).
 * L3: the detour curtain sweeps under the plaques — the detour frame keeps the
 * castle, its gates and their plaque boards where scene 05 has them.
 */
export function GatePlaques({ locale, plaques, quip }: Props) {
  return (
    <SceneLoop id="05-gates" locale={locale} quip={quip}>
      <DetourCurtain forkId="gates" />
      {GATE_PLAQUES.map((box, i) => (
        <span key={i} className="quest-plaque" style={plaqueStyle(box)} aria-hidden>
          {plaques[i]}
        </span>
      ))}
    </SceneLoop>
  )
}
