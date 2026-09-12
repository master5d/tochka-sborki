import type { Locale } from '../dictionaries'
import { art, type Art } from './art'
import type { Guide } from './content'

export type SceneId = '01-map' | '02-camp' | '03-boulder' | '04-temple' | '05-gates' | '06-wall' | '07-signs'

/** The world follows the reader's theme, not the time of day. */
export type SceneState = 'day' | 'night'

export interface Scene {
  id: SceneId
  /** Native pixel size of the tall art at @1x (all scenes share it, both states; @2x is double). */
  width: 848
  height: 1264
  alt: Record<Locale, string>
}

export const SCENE_IDS: SceneId[] = ['01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs']

export const SCENES: Record<SceneId, Scene> = {
  '01-map': {
    id: '01-map', width: 848, height: 1264,
    alt: {
      en: 'A fantasy world map from above: a glowing straight fast track through the centre and a winding side-quest trail along the edge; the Scroller on a cushion and the Builder in a hard hat at the start, Sirius in the sky.',
      ru: 'Фэнтези-карта мира сверху: светящаяся прямая «fast track» через центр и извилистая тропа «side quest» по краю; на старте Скроллер на подушке и Сборщица в каске, в небе Сириус.',
    },
  },
  '02-camp': {
    id: '02-camp', width: 848, height: 1264,
    alt: {
      en: 'A camp by a fire at dusk: the Scroller warms his hands over a phone, the Builder lays tools out on a map; a signpost with two blank arrows between them.',
      ru: 'Лагерь у костра в сумерках: Скроллер греет руки о телефон, Сборщица раскладывает инструменты на карту; между ними указатель с двумя пустыми стрелками.',
    },
  },
  '03-boulder': {
    id: '03-boulder', width: 848, height: 1264,
    alt: {
      en: 'The trail runs into a huge boulder with a screen on its side; the Scroller sits on top with his phone, the Builder pulls a crowbar and rope from her backpack.',
      ru: 'Тропа упирается в огромный валун с экраном на боку; Скроллер сидит сверху с телефоном, Сборщица достаёт из рюкзака лом и верёвку.',
    },
  },
  '04-temple': {
    id: '04-temple', width: 848, height: 1264,
    alt: {
      en: 'A hall that turns from a temple into a workshop: candles and mats on the left, a workbench with monitors on the right; in the centre the Builder takes off a turban and lifts her hard hat.',
      ru: 'Зал, переходящий из храма в мастерскую: слева свечи и коврики, справа верстак с мониторами; в центре Сборщица снимает тюрбан и поднимает каску.',
    },
  },
  '05-gates': {
    id: '05-gates', width: 848, height: 1264,
    alt: {
      en: 'A castle with two gates: the left wooden and open, the right wrought iron with a blueprint on its leaf; the Scroller and the Builder stand in front of them.',
      ru: 'Замок с двумя воротами: левые деревянные и открытые, правые кованые с чертежом на створке; перед ними стоят Скроллер и Сборщица.',
    },
  },
  '06-wall': {
    id: '06-wall', width: 848, height: 1264,
    alt: {
      en: 'View from the castle wall over the crossed land: the boulder broken into steps, the temple-workshop glowing, a line of small figures in hard hats walking to the gates; the Scroller now wears a hard hat too.',
      ru: 'Вид с крепостной стены на пройденную землю: валун разобран на ступени, храм-мастерская светится, к воротам идёт вереница маленьких фигур в касках; Скроллер тоже в каске.',
    },
  },
  '07-signs': {
    id: '07-signs', width: 848, height: 1264,
    alt: {
      en: 'Two card signs at the foot of the wall: the left with a silhouette portrait in a hard hat, the right with a gear.',
      ru: 'Две карточки-таблички у подножия стены: левая с портретом-силуэтом в каске, правая с шестерёнкой.',
    },
  },
}

export interface SceneAssets { poster: Art; loop: Art }

/**
 * `state` is the world's current light — day or night — driven by the reader's
 * theme (useThemeState), not the wall clock. Only the FLAT scenes (03/04/05 —
 * `isSplitScene` false) use these: a split scene renders its two plates instead
 * (plates.ts), so no poster or loop ships for 01/02/06/07. 2K world (art.ts):
 * `<id>-<state>@1x|@2x`, unless the frame is still waiting for its 2K pair.
 */
export function sceneAssets(id: SceneId, state: SceneState): SceneAssets {
  return {
    poster: art(`/quest/scenes/${id}-${state}`, 'webp', 848, 1264),
    loop: art(`/quest/loops/${id}-${state}`, 'mp4', 848, 1264),
  }
}

/**
 * `sizes` for the art, per place it is drawn: the CSS width the frame is drawn at
 * under cover-fit, so the browser's srcset pick agrees with `pickDensity` for the
 * loops. Stage top = 3.25rem (`--quest-stage-top`).
 *  - road: the 848×1264 cover box over 100vw × (100vh − top) — drawn at the wider of
 *    100vw and the box height × 848/1264.
 *  - campWide: the landscape camp in the same box, art 1264×848.
 *  - heroWide: the landscape map under the hero drift (box 122% of 100vh − top), art 3:2.
 *  - full: the finale frame (always wider than 3:2) — the viewport width.
 */
export const ART_SIZES = {
  road: '(min-aspect-ratio: 848/1264) 100vw, calc((100vh - 3.25rem) * 0.6709)',
  campWide: '(min-aspect-ratio: 3/2) 100vw, calc((100vh - 3.25rem) * 1.4906)',
  heroWide: '(min-aspect-ratio: 183/100) 100vw, calc((100vh - 3.25rem) * 1.83)',
  full: '100vw',
} as const

export const GUIDE_ASSETS = {
  scroller: '/quest/guides/scroller.png',
  builder: '/quest/guides/builder.png',
} as const

/**
 * Blank plaques on scene 05, measured on the 848×1264 world-v3 art (day state; the
 * night state shares the same composition) by flood-filling the plaque colour
 * (left 215–358 × 555–594, right 479–602 × 561–589), inset ~1pp. Percent of frame.
 * The v4-2k redraw keeps the frame exactly (phase-correlation shift 0 px), so the
 * percentages hold for both densities.
 */
export interface PlaqueBox { left: number; top: number; width: number; height: number }
export const GATE_PLAQUES: [PlaqueBox, PlaqueBox] = [
  { left: 26, top: 44.2, width: 15.9, height: 2.5 },
  { left: 57, top: 44.7, width: 13.5, height: 1.8 },
]

/**
 * Wave M: where each fork's pinned road scene looks while each of its three
 * panels (setup, habit road, detour) is read — object-position fractions of the
 * 848×1264 art, read off the art's bands (keyframePan interpolates). boulder:
 * the Scroller on top of the rock → the Builder under it → the Builder climbing
 * the detour's steps. temple: the Builder's face in both worlds. gates: the
 * lettered plaques stay in frame throughout (scenes.test.ts asserts it).
 */
export const ROAD_PAN: Record<'boulder' | 'temple' | 'gates', readonly [number, number, number]> = {
  boulder: [0.1, 0.85, 0.3],
  temple: [0.35, 0.6, 0.55],
  gates: [0.45, 0.7, 0.6],
}

/** Wave D: the three forks that split into a habit road and a detour. */
export type ForkId = 'boulder' | 'temple' | 'gates'
export const FORK_IDS: ForkId[] = ['boulder', 'temple', 'gates']

/**
 * The camp as a landscape frame (1264×848 at @1x) for `#intro`'s pinned backdrop
 * on desktop: cover-fitting the portrait 02-camp into a landscape box cropped the
 * two characters to a helmet (audit4). Here both sit whole in the left half and
 * the right third is open land for the panels. Mobile keeps the portrait scene —
 * its box is portrait too.
 */
export const CAMP_WIDE_SIZE = { width: 1264, height: 848 } as const
export function campWide(state: SceneState): Art {
  return art(`/quest/scenes/02-camp-wide-${state}`, 'webp', CAMP_WIDE_SIZE.width, CAMP_WIDE_SIZE.height)
}
/** Its loop; frame 0 is the still above (same pair of sizes). */
export function campWideLoop(state: SceneState): Art {
  return art(`/quest/loops/02-camp-wide-${state}`, 'mp4', CAMP_WIDE_SIZE.width, CAMP_WIDE_SIZE.height)
}

/**
 * L2: one tall illustration per road's outcome (640×960, NAUTILUS
 * `outcomes-v3/outcome-<fork>-<habit|detour>-<state>.webp`), keyed on the site
 * side by `Outcome.guide` (scroller/builder) — quest-assets.ps1 translates.
 * All twelve still wait for their 2K pair (awaiting-2k.json) and ship at 1K.
 */
export const OUTCOME_ART_SIZE = { width: 640, height: 960 } as const
export function outcomeArt(forkId: ForkId, guide: Guide, state: SceneState): string {
  return `/quest/outcomes/${forkId}-${guide}-${state}.webp`
}

/**
 * L3: the detour's world for the curtain — shot from the fork scene's own camera
 * and horizon, same 848×1264 frame, so it can be wiped over that scene in place.
 */
export const DETOUR_SCENE_SIZE = { width: 848, height: 1264 } as const
export function detourScene(forkId: ForkId, state: SceneState): Art {
  return art(`/quest/detours/${forkId}-${state}`, 'webp', DETOUR_SCENE_SIZE.width, DETOUR_SCENE_SIZE.height)
}
