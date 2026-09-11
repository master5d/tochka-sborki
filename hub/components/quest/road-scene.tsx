'use client'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import type { Locale } from '../../lib/dictionaries'
import type { Fork, QuestContent } from '../../lib/quest/content'
import type { PathMark } from '../../lib/quest/route'
import { ROAD_PAN } from '../../lib/quest/scenes'
import { DetourCurtain } from './detour-curtain'
import { GatePlaques } from './gate-plaques'
import { PathCard } from './path-fork'
import { SceneLoop } from './scene-loop'
import { keyframePan, pinProgress } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

interface Props {
  fork: Fork
  locale: Locale
  labels: QuestContent['labels']
  /** The chapter's setup paragraphs (already rendered by the caller). */
  setup: ReactNode
  quip?: string
  mark?: PathMark
  onMark: (mark: PathMark) => void
}

/**
 * Wave M: a fork's whole road in ONE pinned full-bleed scene (the reference
 * holds each road for 4–5 screens). The scene stays on screen for the chapter;
 * three panels travel over it on their own opaque surfaces — the setup on the
 * chapter tint, then the habit road and the detour as cards (the road's own
 * title is still the "mark this road" control). The curtain inside the scene
 * follows the detour card into view (`data-curtain-trigger`, see
 * detour-curtain.tsx), so the world changes exactly as the other road is read.
 *
 * The art (848×1264) is laid out by `.quest-cover` as a true cover box — the
 * scene keeps its own aspect, so the gate plaques and the curtain stay glued to
 * the art — and `--pan` moves it vertically through `ROAD_PAN` as the pin
 * travels (one shared rAF, no re-render). Reduced motion: held on the habit
 * road's stop, no curtain (DetourCurtain renders nothing), panels unchanged.
 */
export function RoadScene({ fork, locale, labels, setup, quip, mark, onMark }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const stops = ROAD_PAN[fork.id]

  useParallaxFrame(() => {
    const stage = stageRef.current
    const scene = sceneRef.current
    const cover = coverRef.current
    if (!stage || !scene || !cover) return
    const s = stage.getBoundingClientRect()
    const m = scene.getBoundingClientRect()
    cover.style.setProperty('--pan', keyframePan(pinProgress(m.top - s.top, s.height - m.height), stops).toFixed(4))
  }, !reducedMotion)

  // The first tick can land before the reduced-motion query resolves (the hook
  // starts at false) — pin the art back on the habit road's stop once it does.
  useEffect(() => {
    if (reducedMotion) coverRef.current?.style.setProperty('--pan', String(stops[1]))
  }, [reducedMotion, stops])

  const mirror = fork.id === 'temple'
  return (
    <div ref={stageRef} className={mirror ? 'quest-backdrop quest-backdrop--road quest-backdrop--mirror' : 'quest-backdrop quest-backdrop--road'} data-fork={fork.id}>
      <div className="quest-backdrop__scene" ref={sceneRef}>
        <div className="quest-cover" ref={coverRef} style={{ '--pan': String(stops[1]) } as CSSProperties}>
          {fork.id === 'gates' ? (
            <GatePlaques locale={locale} plaques={labels.plaques} />
          ) : (
            <SceneLoop id={fork.scene} locale={locale}>
              <DetourCurtain forkId={fork.id} />
            </SceneLoop>
          )}
        </div>
        {quip ? <div className="quest-scene__quip">{quip}</div> : null}
      </div>
      <div className="quest-backdrop__copy">
        <div className="quest-backdrop__panel">{setup}</div>
        <div className="quest-backdrop__panel quest-backdrop__panel--card">
          <PathCard fork={fork} which="habit" labels={labels} mark={mark} onMark={onMark} />
        </div>
        <div className="quest-backdrop__panel quest-backdrop__panel--card" data-curtain-trigger>
          <PathCard fork={fork} which="detour" labels={labels} mark={mark} onMark={onMark} />
        </div>
      </div>
    </div>
  )
}
