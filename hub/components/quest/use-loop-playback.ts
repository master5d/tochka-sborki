'use client'
import { useEffect, useRef, type RefObject } from 'react'
import { loopAction, PAUSE_AFTER_SCROLL_IDLE_MS, shouldPlayLoop } from '../../lib/quest/loop-playback'

/**
 * Drives one scene loop (SceneLoop, WideLoop): plays it while it is on screen
 * (IntersectionObserver, 200 px margin) in a visible tab, and pauses it once it
 * has left the screen AND the scroll has gone still (`loopAction`). Returns
 * `playAllowed`, which the caller's source loader consults so a day/night
 * reload off screen loads the track without starting it.
 *
 * Trace, 2026-09-12 (Iris Xe): the 2K loops cost the GPU main thread ~50-100 ms
 * twice — when a loop is PAUSED mid-scroll and when one STARTS for the first
 * time (hardware decoder setup) — and each showed as dropped frames. So: the
 * pause waits for a still moment, and every loop is warmed once right after it
 * has loaded (played until its first frame is up, then handed back to the same
 * rules) while the page is typically still — the reader is on the first screen.
 */
export function useLoopPlayback(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, reducedMotion: boolean) {
  const playAllowed = useRef(false)
  useEffect(() => {
    const video = videoRef.current
    if (!enabled || !video) return
    let onScreen = false
    let lastScroll = Number.NEGATIVE_INFINITY
    let timer: number | undefined
    let warmed = false
    let live = true
    const pageVisible = () => document.visibilityState !== 'hidden'
    const later = (ms: number) => { window.clearTimeout(timer); timer = window.setTimeout(apply, ms) }
    function apply() {
      if (!live) return
      const scrollIdleMs = performance.now() - lastScroll
      playAllowed.current = shouldPlayLoop({ onScreen, pageVisible: pageVisible(), reducedMotion })
      const action = loopAction({ onScreen, pageVisible: pageVisible(), reducedMotion, scrollIdleMs })
      if (action === 'play') video!.play().catch(() => {})
      else if (action === 'pause') video!.pause()
      else if (!video!.paused) later(PAUSE_AFTER_SCROLL_IDLE_MS - scrollIdleMs + 16)
    }
    // Warm-up: once, off screen, when the track can play — run it to its first
    // painted frame, then let `apply` decide (pause now if the page is still,
    // or once the scroll goes idle).
    const warm = () => {
      if (warmed || onScreen || reducedMotion || !pageVisible()) return
      warmed = true
      video.play().then(() => {
        const handBack = () => window.setTimeout(apply, 120)
        const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }
        if (typeof v.requestVideoFrameCallback === 'function') v.requestVideoFrameCallback(handBack)
        else handBack()
      }).catch(() => apply())
    }
    const onCanPlay = () => warm()
    video.addEventListener('canplay', onCanPlay)
    if (video.readyState >= 3) warm()
    const onScroll = () => {
      lastScroll = performance.now()
      if (!onScreen && !video.paused) later(PAUSE_AFTER_SCROLL_IDLE_MS + 16)
    }
    const io = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; apply() }, { rootMargin: '200px 0px' })
    if (io) io.observe(video)
    else { onScreen = true; apply() }
    document.addEventListener('visibilitychange', apply)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      live = false
      io?.disconnect()
      window.clearTimeout(timer)
      video.removeEventListener('canplay', onCanPlay)
      document.removeEventListener('visibilitychange', apply)
      window.removeEventListener('scroll', onScroll)
    }
  }, [videoRef, enabled, reducedMotion])
  return playAllowed
}
