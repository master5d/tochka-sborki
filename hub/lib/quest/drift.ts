// Parallax drift for the quest's art, UNIFORM by construction (2026-09-12 pixel
// audit). The earlier cut bought vertical room for the drift with scaleY — the hero
// wrapper at 1.22 and the land plates ramping to 1.15 — which stretched the art up
// to 1.39× on one axis. Every function here returns either a pure translate or a
// single scale factor applied to both axes; there is no way to express a one-axis
// stretch through this module.
//
// - Hero: the drift wrapper's BOX is taller than the frame (HERO_SURPLUS of the
//   frame's height past each edge, set in CSS as `inset: -11% 0`), so the art has
//   real, unstretched pixels above and below to move into. The drift itself is a
//   translate only.
// - Land plates: a uniform zoom about the seam line, ramping from 1 at progress 0.
//   Zooming about the seam keeps the seam row still (it then only moves UP with the
//   translate — the direction that grows the sky/land overlap, never exposes it) and
//   grows fresh land downward, which is exactly the room the upward drift needs.
//   Sideways the zoom spills past the plate's own clip — that is the nearer plane
//   growing, i.e. real depth, not a stretch.

export interface Box { w: number; h: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const HERO_DRIFT_TARGET = 80
/** Fraction of the hero frame's height the drift box extends past EACH edge (CSS `inset: -11% 0`). */
export const HERO_SURPLUS = 0.11

/** Downward lag of the hero art, px, for 0…1 progress through the frame. 85% of the surplus at most. */
export function heroDrift(progress: number, frameHeight: number): number {
  const amplitude = Math.min(HERO_DRIFT_TARGET, HERO_SURPLUS * Math.max(0, frameHeight) * 0.85)
  return clamp(progress, 0, 1) * amplitude
}

/** Box-space y of an image row under `object-fit: cover` with vertical `object-position` posY (0…1). */
export function coverRowY(box: Box, natural: Box, posY: number, row: number): number {
  const s = Math.max(box.w / natural.w, box.h / natural.h)
  return (box.h - natural.h * s) * clamp(posY, 0, 1) + row * s
}

export const LAND_DRIFT_TARGET = 55
export const LAND_ZOOM_MAX = 1.1

export interface LandDrift {
  /** px, always ≤ 0 (land only ever rises). */
  translateY: number
  /** One factor for BOTH axes. */
  scale: number
  /** px from the plate box's top: the transform origin, clamped into the box. */
  originY: number
}

/**
 * Land plate drift at 0…1 progress. Identity at 0 (reduced motion / no JS leave the
 * CSS defaults, which are identity too). The amplitude is capped so the plate's bottom
 * edge never rises into view: the zoom's growth below the origin, (scale−1)·(h−originY),
 * always covers the rise, with the same 85% margin the hero uses.
 */
export function landDrift(progress: number, box: Box, originY: number, target = LAND_DRIFT_TARGET, zoomMax = LAND_ZOOM_MAX): LandDrift {
  const p = clamp(progress, 0, 1)
  const oy = clamp(originY, 0, box.h)
  const below = box.h - oy
  const amplitude = Math.min(target, 0.85 * (zoomMax - 1) * below)
  return { translateY: -p * amplitude, scale: 1 + p * (zoomMax - 1), originY: oy }
}
