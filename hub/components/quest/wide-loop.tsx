'use client'
import { useEffect, useRef, useState } from 'react'
import { shouldPlayLoop, wideLoopSource } from '../../lib/quest/loop-playback'
import { CAMP_WIDE_SIZE, campWide } from '../../lib/quest/scenes'
import { ThemedPicture } from './themed-picture'
import { useReducedMotion } from './use-parallax'
import { useThemeState } from './use-theme-state'

const DESKTOP = '(min-width: 901px)'

function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const apply = () => setDesktop(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return desktop
}

/**
 * #intro's landscape camp on desktop: the still (ThemedPicture, which also
 * handles the no-JS and theme-flip cases) with its loop playing on top in the
 * same box and the same cover-fit pan. The video carries no poster of its own —
 * until its first frame paints (and while a day/night switch reloads it) the
 * still underneath shows, and frame 0 of the loop is that same still.
 * Same playback rules as SceneLoop: only on screen, only in a visible tab; the
 * track resumes at the old time on a theme flip. Mobile and reduced motion get
 * no <video> at all (wideLoopSource → null), so nothing is downloaded there.
 */
export function WideLoop({ alt }: { alt: string }) {
  const theme = useThemeState()
  const reducedMotion = useReducedMotion()
  const desktop = useDesktop()
  const src = wideLoopSource({ desktop, reducedMotion, state: theme })
  const videoRef = useRef<HTMLVideoElement>(null)
  const playAllowed = useRef(false)
  const mounted = src !== null

  useEffect(() => {
    const video = videoRef.current
    if (!mounted || !video) return
    let onScreen = false
    const apply = () => {
      playAllowed.current = shouldPlayLoop({ onScreen, pageVisible: document.visibilityState !== 'hidden', reducedMotion })
      if (playAllowed.current) video.play().catch(() => {})
      else video.pause()
    }
    const io = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; apply() }, { rootMargin: '200px 0px' })
    if (io) io.observe(video)
    else { onScreen = true; apply() }
    document.addEventListener('visibilitychange', apply)
    return () => {
      io?.disconnect()
      document.removeEventListener('visibilitychange', apply)
    }
  }, [mounted, reducedMotion])

  useEffect(() => {
    const video = videoRef.current
    if (!src || !video) return
    const resumeAt = video.currentTime || 0
    const wasStarted = video.readyState > 0
    const onLoaded = () => {
      if (wasStarted) video.currentTime = resumeAt
      if (playAllowed.current) video.play().catch(() => {})
      video.removeEventListener('loadedmetadata', onLoaded)
    }
    video.addEventListener('loadedmetadata', onLoaded)
    video.src = src
    video.load()
    return () => video.removeEventListener('loadedmetadata', onLoaded)
  }, [src])

  return (
    <>
      <ThemedPicture day={campWide('day')} night={campWide('night')} width={CAMP_WIDE_SIZE.width} height={CAMP_WIDE_SIZE.height} alt={alt} />
      {mounted ? (
        <video
          ref={videoRef}
          className="quest-backdrop__wide-video"
          width={CAMP_WIDE_SIZE.width}
          height={CAMP_WIDE_SIZE.height}
          muted
          loop
          playsInline
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}
    </>
  )
}
