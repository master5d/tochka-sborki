// The 2K world (NAUTILUS v4-2k, dc90d740): every still and loop ships as a pair —
// `<base>@1x` (the old frame size) and `<base>@2x` (exactly twice as wide) — and the
// browser picks by `srcset`/`sizes` (stills) or code picks by the same rule (loops).
// A frame still waiting for its 2K pair (awaiting-2k.json — the generation stopped
// on the Google balance) keeps its 1K world-v3 file as the only candidate.
import awaiting from './awaiting-2k.json'

const WAITING = new Set<string>(awaiting.paths)

/** One picture (or loop) at up to two densities. `w1×h1` is the @1x natural size; @2x is exactly double. */
export interface Art {
  x1: string
  x2?: string
  w1: number
  h1: number
}

/** `base` without extension, e.g. `/quest/scenes/03-boulder-day`. */
export function art(base: string, ext: 'webp' | 'mp4', w1: number, h1: number): Art {
  const legacy = `${base}.${ext}`
  if (WAITING.has(legacy)) return { x1: legacy, w1, h1 }
  return { x1: `${base}@1x.${ext}`, x2: `${base}@2x.${ext}`, w1, h1 }
}

/** `srcset` with width descriptors, or `undefined` for a single-candidate (awaiting) frame. */
export function srcSetOf(a: Art): string | undefined {
  return a.x2 ? `${a.x1} ${a.w1}w, ${a.x2} ${a.w1 * 2}w` : undefined
}

/** Where a srcset should point when there is only one file (a `<source srcSet>` needs a value). */
export function srcSetOrSrc(a: Art): string {
  return srcSetOf(a) ?? a.x1
}

export interface Box { w: number; h: number }

/**
 * The loop's own copy of the browser's srcset rule: the CSS width the frame is
 * drawn at under `object-fit: cover` (a box of the art's own aspect draws at its
 * own width) times the device pixel ratio — more than the @1x file holds → @2x.
 * Same inputs the poster's `sizes` describes, so poster and loop land on the
 * same density and the switch from still to motion never changes sharpness.
 */
export function pickDensity(a: Art, box: Box, dpr: number): string {
  if (!a.x2) return a.x1
  if (!(box.w > 0 && box.h > 0)) return a.x2
  const drawnWidth = Math.max(box.w, box.h * (a.w1 / a.h1))
  return drawnWidth * dpr > a.w1 ? a.x2 : a.x1
}

/** Every path still on 1K (for the pixel guard's exception list and tests). */
export const AWAITING_2K: readonly string[] = awaiting.paths
