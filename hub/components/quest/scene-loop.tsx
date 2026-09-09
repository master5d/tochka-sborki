'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { SCENES, sceneAssets, type SceneId } from '../../lib/quest/scenes'

interface Props {
  id: SceneId
  locale: Locale
  /** Mono caption in the corner, switches with the active step. */
  caption?: string
  /** Absolutely positioned children over the art (plaques). */
  children?: ReactNode
  /** The hero loop may start eagerly; everything else waits for the viewport. */
  eager?: boolean
}

/**
 * Poster first, video only when motion is allowed and the frame is on screen.
 * Frame 0 of every loop equals the poster, so the swap is invisible.
 */
export function SceneLoop({ id, locale, caption, children, eager = false }: Props) {
  const scene = SCENES[id]
  const assets = sceneAssets(id)
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [motion, setMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setMotion(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!motion) return
    const el = ref.current
    const video = videoRef.current
    if (!el || !video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [motion])

  return (
    <div ref={ref} className="quest-scene" data-scene={id}>
      {motion ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload={eager ? 'auto' : 'none'}
          autoPlay={eager}
          poster={assets.poster}
          width={scene.width}
          height={scene.height}
          aria-label={scene.alt[locale]}
        >
          <source src={assets.loop} type="video/mp4" />
        </video>
      ) : (
        <img src={assets.poster} width={scene.width} height={scene.height} alt={scene.alt[locale]} loading={eager ? 'eager' : 'lazy'} />
      )}
      {children}
      {caption ? <div className="quest-scene__caption">{caption}</div> : null}
    </div>
  )
}
