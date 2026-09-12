import { campWideLoop, type SceneState } from './scenes'

/**
 * Cover motion: when a scene loop should be running. A loop plays only while
 * its scene is on screen and the tab is visible; reduced motion never plays
 * one (SceneLoop does not even render the <video> then — this is the second
 * guard, for a preference that flips after mount).
 */
export interface PlaybackState {
  onScreen: boolean
  pageVisible: boolean
  reducedMotion: boolean
}

export function shouldPlayLoop({ onScreen, pageVisible, reducedMotion }: PlaybackState): boolean {
  return onScreen && pageVisible && !reducedMotion
}

/**
 * The landscape camp loop behind #intro. It lives in a box that only shows on
 * desktop (>=901px, quest.css), so mobile must not even download it; reduced
 * motion keeps the still. `null` = render no <video>.
 */
export function wideLoopSource({ desktop, reducedMotion, state }: { desktop: boolean; reducedMotion: boolean; state: SceneState }): string | null {
  return desktop && !reducedMotion ? campWideLoop(state) : null
}
