'use client'
import { useEffect, useState, type RefObject } from 'react'

/** Index of the most visible step; 0 when none is visible; earlier wins ties. */
export function pickActive(ratios: number[]): number {
  let best = 0
  for (let i = 1; i < ratios.length; i++) if (ratios[i] > ratios[best]) best = i
  return best
}

/**
 * Observes `[data-step]` children of `container` and reports the most visible one.
 * Without IntersectionObserver the first step stays active (page readable at rest).
 */
export function useActiveStep(container: RefObject<HTMLElement | null>, count: number): number {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const root = container.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'))
    const ratios = new Array<number>(steps.length).fill(0)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.step)
          ratios[i] = e.isIntersecting ? e.intersectionRatio : 0
        }
        setActive(pickActive(ratios))
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-15% 0px -15% 0px' },
    )
    steps.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [container, count])
  return active
}
