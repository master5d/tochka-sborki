import type { SkinMeta, WorldSkin } from './types'

export const SKINS_META: Record<WorldSkin, SkinMeta> = {
  'slavic-myth':   { skin: 'slavic-myth',   accent: '#7bd88f', glyph: '🌿', displayName: { ru: 'Славянский Миф', en: 'Slavic Myth' }, mentor: { name: { ru: 'Домовой', en: 'House-Spirit' }, glyph: '🪆' } },
  'dark-fantasy':  { skin: 'dark-fantasy',  accent: '#ff5577', glyph: '🏰', displayName: { ru: 'Тёмное Фэнтези', en: 'Dark Fantasy' }, mentor: { name: { ru: 'Хранитель', en: 'The Keeper' }, glyph: '🗝️' } },
  'cyber-noir':    { skin: 'cyber-noir',    accent: '#00e5ff', glyph: '🕶️', displayName: { ru: 'Кибер-Нуар', en: 'Cyber Noir' }, mentor: { name: { ru: 'Фиксер', en: 'The Fixer' }, glyph: '🕶️' } },
  'space-opera':   { skin: 'space-opera',   accent: '#4d8cff', glyph: '🚀', displayName: { ru: 'Космическая Опера', en: 'Space Opera' }, mentor: { name: { ru: 'Бортовой ИИ', en: 'Ship AI' }, glyph: '🛰️' } },
  'anime-quest':   { skin: 'anime-quest',   accent: '#ff7ace', glyph: '🎌', displayName: { ru: 'Аниме-Квест', en: 'Anime Quest' }, mentor: { name: { ru: 'Сэнсэй', en: 'Sensei' }, glyph: '🥋' } },
  'soviet-heroic': { skin: 'soviet-heroic', accent: '#e0b020', glyph: '🏛', displayName: { ru: 'Советский Героизм', en: 'Soviet Heroic' }, mentor: { name: { ru: 'Бригадир', en: 'The Foreman' }, glyph: '🔧' } },
  'mystic-arcane': { skin: 'mystic-arcane', accent: '#b388ff', glyph: '🔮', displayName: { ru: 'Мистическая Аркана', en: 'Mystic Arcane' }, mentor: { name: { ru: 'Оракул', en: 'The Oracle' }, glyph: '🔮' } },
  'wanderer':      { skin: 'wanderer',      accent: '#00d1ff', glyph: '🌀', displayName: { ru: 'Странник', en: 'Wanderer' }, mentor: { name: { ru: 'Проводник', en: 'Guide' }, glyph: '🧭' } },
}
