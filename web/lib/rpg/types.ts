import type { WorldSkin, CharacterClass, Locale } from '@/lib/intake/types'

export type Bi = { ru: string; en: string }

export interface SkinPack {
  skin: WorldSkin
  zoneNames: Record<string, Bi>   // slug -> zone name
  questTitles: Record<string, Bi> // slug -> quest title
}

export interface SkinMeta {
  skin: WorldSkin
  accent: string                  // hex
  glyph: string                   // emoji
  displayName: Bi
}

export type QuestStatus = 'completed' | 'current' | 'todo'

export interface ZoneVM {
  slug: string
  order: number                   // position in class order (0-based)
  zoneName: string                // localized
  questTitle: string              // localized
  moduleTitle: string             // real module title (subtitle)
  durationLabel: string
  status: QuestStatus
  isNiche: boolean
  href: string
}

export interface QuestLogVM {
  zones: ZoneVM[]
  summary: {
    completedCount: number
    total: number
    legendaryTitle: string
    charClass: CharacterClass
    skin: WorldSkin
    level: number
  }
}

export type { WorldSkin, CharacterClass, Locale }
