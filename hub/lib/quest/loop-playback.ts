import type { Art } from './art'
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
 * How long the page must sit without a scroll before a loop that has left the
 * screen is paused. Trace, 2026-09-12 (Iris Xe, 1920@1): pausing a 2K
 * hardware-decoded loop mid-scroll — #temple's, as #gates' starts — held the GPU
 * main thread (D3D11 decoder / DirectComposition overlay swap) and the page
 * dropped 2-3 frames of ~100 ms, every run; with the pause deferred, 0 in 4 runs.
 * Deferring it to a still moment costs a few hundred ms of extra decode and
 * nothing a reader can see.
 */
export const PAUSE_AFTER_SCROLL_IDLE_MS = 600

/**
 * `play` / `pause` now, or `keep` whatever the video is doing and ask again once
 * the scroll goes idle. A hidden tab or reduced motion pauses at once — nothing
 * on screen moves then, so the pause cannot cost a visible frame.
 */
export function loopAction(s: PlaybackState & { scrollIdleMs: number }): 'play' | 'pause' | 'keep' {
  if (!s.pageVisible || s.reducedMotion) return 'pause'
  if (s.onScreen) return 'play'
  return s.scrollIdleMs >= PAUSE_AFTER_SCROLL_IDLE_MS ? 'pause' : 'keep'
}

/**
 * The landscape camp loop behind #intro. It lives in a box that only shows on
 * desktop (>=901px, quest.css), so mobile must not even download it; reduced
 * motion keeps the still. `null` = render no <video>. The density (@1x/@2x) is
 * picked where the box is known — `pickDensity` in art.ts.
 */
export function wideLoopSource({ desktop, reducedMotion, state }: { desktop: boolean; reducedMotion: boolean; state: SceneState }): Art | null {
  return desktop && !reducedMotion ? campWideLoop(state) : null
}
