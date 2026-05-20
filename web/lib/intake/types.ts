// web/lib/intake/types.ts
export type Locale = 'ru' | 'en'
export type QuestionFormat = 'number' | 'single' | 'multi' | 'likert' | 'text'
export type AttributeCode = 'INT' | 'WIS' | 'CON' | 'DEX' | 'CHA' | 'STR'
export type ModuleId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export type CharacterClass =
  | 'artificer' | 'mage' | 'operator' | 'healer' | 'sovereign' | 'wanderer'

export type WorldSkin =
  | 'slavic-myth' | 'dark-fantasy' | 'cyber-noir' | 'space-opera'
  | 'anime-quest' | 'soviet-heroic' | 'mystic-arcane' | 'wanderer'

export interface QuestionOption {
  value: string
  label: { ru: string; en: string }
}

export interface Question {
  id: string
  module: ModuleId
  format: QuestionFormat
  required: boolean
  prompt: { ru: string; en: string }
  options?: QuestionOption[]
  showIf?: { questionId: string; equals: string }
}

export interface ModuleIntro {
  id: ModuleId
  title: { ru: string; en: string }
  intro: { ru: string; en: string }
}

export type AnswerValue = string | number | string[]
export type Answers = Record<string, AnswerValue>

export interface ScoreResult {
  int: number; wis: number; con: number; dex: number; cha: number; str: number
  charClass: CharacterClass
  charLevel: number
  worldSkin: WorldSkin
  worldSkinSource: 'g9' | 'g3' | 'wanderer-fallback'
  cogTier: number
  register: string
  sheetLanguage: string
  niche: string | null
  os: string | null
  strLowConfidence: boolean
}
