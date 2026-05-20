import type { SkinMeta, WorldSkin } from './types'

export const SKINS_META: Record<WorldSkin, SkinMeta> = {
  'slavic-myth':   { skin: 'slavic-myth',   accent: '#7bd88f', glyph: '🌿', displayName: { ru: 'Славянский Миф', en: 'Slavic Myth' } },
  'dark-fantasy':  { skin: 'dark-fantasy',  accent: '#ff5577', glyph: '🏰', displayName: { ru: 'Тёмное Фэнтези', en: 'Dark Fantasy' } },
  'cyber-noir':    { skin: 'cyber-noir',    accent: '#00e5ff', glyph: '🕶️', displayName: { ru: 'Кибер-Нуар', en: 'Cyber Noir' } },
  'space-opera':   { skin: 'space-opera',   accent: '#4d8cff', glyph: '🚀', displayName: { ru: 'Космическая Опера', en: 'Space Opera' } },
  'anime-quest':   { skin: 'anime-quest',   accent: '#ff7ace', glyph: '🎌', displayName: { ru: 'Аниме-Квест', en: 'Anime Quest' } },
  'soviet-heroic': { skin: 'soviet-heroic', accent: '#e0b020', glyph: '🏛', displayName: { ru: 'Советский Героизм', en: 'Soviet Heroic' } },
  'mystic-arcane': { skin: 'mystic-arcane', accent: '#b388ff', glyph: '🔮', displayName: { ru: 'Мистическая Аркана', en: 'Mystic Arcane' } },
  'wanderer':      { skin: 'wanderer',      accent: '#00ff88', glyph: '🌀', displayName: { ru: 'Странник', en: 'Wanderer' } },
}
