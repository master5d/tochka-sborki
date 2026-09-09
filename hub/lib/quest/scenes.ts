import type { Locale } from '../dictionaries'

export type SceneId = '01-map' | '02-camp' | '03-boulder' | '04-temple' | '05-gates' | '06-wall' | '07-signs'

/** The world follows the reader's theme, not the time of day. */
export type SceneState = 'day' | 'night'

export interface Scene {
  id: SceneId
  /** Native pixel size of the generated art (all scenes share it, both states). */
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

export interface SceneAssets { poster: string; loop: string }

/**
 * `state` is the world's current light — day or night — driven by the reader's
 * theme (useThemeState), not the wall clock. Loops are absent this wave: the old
 * horizontal loops don't fit the tall frame, so the path is declared for
 * forward-compat but never rendered (see LOOPS_ENABLED in scene-loop.tsx).
 */
export function sceneAssets(id: SceneId, state: SceneState): SceneAssets {
  return { poster: `/quest/scenes/${id}-${state}.webp`, loop: `/quest/loops/${id}-${state}.mp4` }
}

export const GUIDE_ASSETS = {
  scroller: '/quest/guides/scroller.png',
  builder: '/quest/guides/builder.png',
} as const

/**
 * Blank plaques on scene 05, measured on the 848×1264 world-v3 art (day state; the
 * night state shares the same composition) by flood-filling the plaque colour
 * (left 215–358 × 555–594, right 479–602 × 561–589), inset ~1pp. Percent of frame.
 */
export interface PlaqueBox { left: number; top: number; width: number; height: number }
export const GATE_PLAQUES: [PlaqueBox, PlaqueBox] = [
  { left: 26, top: 44.2, width: 15.9, height: 2.5 },
  { left: 57, top: 44.7, width: 13.5, height: 1.8 },
]
