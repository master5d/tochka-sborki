// Wave K: two-plane parallax scenes. A prior task split each accepted scene
// along its natural sky/land seam (NAUTILUS `.worktrees/world-v3/.../plates/`)
// into `<id>-<state>-{sky,land}.webp` plus a manifest carrying, per frame, the
// exact `horizon_row`/`feather`/`size` the split used and an `unsplit` flag for
// frames the split script couldn't cut cleanly. `quest-assets.ps1` copies both
// the manifest and the plate images for symmetric scenes into
// `public/quest/plates/`; this module reads that SAME manifest (imported as
// JSON — resolveJsonModule) so the geometry reaches the page as data, never
// retyped into CSS, and a future re-split (flipping a scene's `unsplit` flag)
// changes `isSplitScene`'s answer automatically.
import manifest from '../../public/quest/plates/manifest.json'
import wideManifest from '../../public/quest/plates/wide/manifest.json'
import type { Art } from './art'
import { SCENE_IDS, type SceneId, type SceneState } from './scenes'

interface ManifestFrame {
  id: string
  state: 'day' | 'night'
  size: [number, number]
  horizon_row: number
  feather: number
  unsplit: boolean
  sky?: string
  land?: string
}

const FRAMES = manifest.scenes as ManifestFrame[]

function frame(id: SceneId, state: SceneState): ManifestFrame | undefined {
  return FRAMES.find((f) => f.id === id && f.state === state)
}

/**
 * Symmetry rule (the owner's ruling): a scene gets two planes only when BOTH
 * its day and night frames split cleanly. A reader flipping the theme must
 * never see one theme gain depth the other lacks. Reads the manifest fresh —
 * no hardcoded id list — so regenerating a scene (and re-running the split)
 * changes this automatically, in either direction.
 */
export function isSplitScene(id: SceneId): boolean {
  const day = frame(id, 'day')
  const night = frame(id, 'night')
  if (!day || !night) return false
  return day.unsplit === false && night.unsplit === false && !!day.sky && !!day.land && !!night.sky && !!night.land
}

/** Every scene id for which `isSplitScene` holds, in narrative order. */
export const SPLIT_SCENE_IDS: SceneId[] = SCENE_IDS.filter(isSplitScene)

export interface PlateGeometry {
  /** Row (0-based, native pixels) where the manifest's sky/land seam sits. */
  horizonRow: number
  /** Width in native pixels of the alpha feather blending the two plates at the seam. */
  feather: number
  width: number
  height: number
  sky: string
  land: string
}

/**
 * `null` for anything not passing `isSplitScene` (including a frame missing
 * from the manifest) — callers branch on `isSplitScene` first and treat this
 * as a same-answer guard, never the primary check.
 */
export function plateGeometry(id: SceneId, state: SceneState): PlateGeometry | null {
  if (!isSplitScene(id)) return null
  const f = frame(id, state)
  if (!f || !f.sky || !f.land) return null
  return {
    horizonRow: f.horizon_row,
    feather: f.feather,
    width: f.size[0],
    height: f.size[1],
    sky: `/quest/plates/${f.sky}`,
    land: `/quest/plates/${f.land}`,
  }
}

/**
 * 2K world (NAUTILUS v4-2k): the hero map and the finale wall re-composed for a
 * LANDSCAPE frame (3:2, 2K). On desktop (≥901px) they replace the tall art, which
 * cover-fit into the wide hero/finale boxes showed 22–52 % of itself at up to 4.7×
 * device-px upscale (2026-09-12 pixel audit). Split into sky/land by the same
 * script under the same symmetry rule; read from `public/quest/plates/wide/manifest.json`
 * (the NAUTILUS plates manifest, copied as-is). `width`/`height`/`horizonRow` are in
 * the @2x file's pixels; @1x is exactly half.
 */
interface WideFrame {
  id: string
  state: 'day' | 'night'
  size?: number[]
  horizon_row?: number
  feather?: number
  unsplit: boolean
  sky_1x?: string
  sky_2x?: string
  land_1x?: string
  land_2x?: string
}
const WIDE_FRAMES = wideManifest.scenes as WideFrame[]
const WIDE_ID: Partial<Record<SceneId, string>> = { '01-map': '01-map-wide', '06-wall': '06-wall-wide' }

export interface WidePlates {
  horizonRow: number
  feather: number
  width: number
  height: number
  sky: Art
  land: Art
}

function wideFrame(id: SceneId, state: SceneState): WideFrame | undefined {
  const wideId = WIDE_ID[id]
  return wideId ? WIDE_FRAMES.find((f) => f.id === wideId && f.state === state) : undefined
}

function wideOk(f: WideFrame | undefined): f is Required<WideFrame> {
  return !!f && !f.unsplit && !!f.size && f.horizon_row !== undefined && f.feather !== undefined &&
    !!f.sky_1x && !!f.sky_2x && !!f.land_1x && !!f.land_2x
}

/** `null` unless BOTH states of this scene's landscape version split cleanly (symmetry rule). */
export function widePlates(id: SceneId, state: SceneState): WidePlates | null {
  const day = wideFrame(id, 'day')
  const night = wideFrame(id, 'night')
  if (!wideOk(day) || !wideOk(night)) return null
  const f = state === 'day' ? day : night
  const [w, h] = f.size
  const w1 = Math.round(w / 2)
  const h1 = Math.round(h / 2)
  const at = (p: string) => `/quest/plates/wide/${p}`
  return {
    horizonRow: f.horizon_row,
    feather: f.feather,
    width: w,
    height: h,
    sky: { x1: at(f.sky_1x), x2: at(f.sky_2x), w1, h1 },
    land: { x1: at(f.land_1x), x2: at(f.land_2x), w1, h1 },
  }
}
