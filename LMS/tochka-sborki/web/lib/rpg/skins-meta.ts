import type { SkinMeta, WorldSkin } from './types'
import type { Locale } from '../intake/types'

export const SKINS_META: Record<WorldSkin, SkinMeta> = {
  'slavic-myth':   { skin: 'slavic-myth',   accent: '#7bd88f', glyph: '🌿', displayName: { ru: 'Славянский Миф', en: 'Slavic Myth' }, mentor: { name: { ru: 'Домовой', en: 'House-Spirit' }, glyph: '🪆' }, decoder: { ru: 'Твой мир — Славянский Миф: уроки звучат как сказ, наставник — Домовой, агенты — помощники у очага. Это лишь образ — под ним обычный курс.', en: "Your world is Slavic Myth: lessons sound like folk tales, your mentor is the House-Spirit, agents are hearth-helpers. It's just imagery — underneath is a normal course." } },
  'dark-fantasy':  { skin: 'dark-fantasy',  accent: '#ff5577', glyph: '🏰', displayName: { ru: 'Тёмное Фэнтези', en: 'Dark Fantasy' }, mentor: { name: { ru: 'Хранитель', en: 'The Keeper' }, glyph: '🗝️' }, decoder: { ru: 'Твой мир — Тёмное Фэнтези: модули — Искажённые Земли, навыки — Печати, наставник — Хранитель. Это лишь антураж — под ним обычный курс.', en: "Your world is Dark Fantasy: modules are Blighted Lands, skills are Seals, your mentor is the Keeper. It's just set dressing — underneath is a normal course." } },
  'cyber-noir':    { skin: 'cyber-noir',    accent: '#00e5ff', glyph: '🕶️', displayName: { ru: 'Кибер-Нуар', en: 'Cyber Noir' }, mentor: { name: { ru: 'Фиксер', en: 'The Fixer' }, glyph: '🕶️' }, decoder: { ru: 'Твой мир — Кибер-Нуар: локации — притоны и мастерские, наставник — Фиксер. Это лишь стиль — под ним обычный курс.', en: "Your world is Cyber Noir: locations are dens and workshops, your mentor is the Fixer. It's just style — underneath is a normal course." } },
  'space-opera':   { skin: 'space-opera',   accent: '#4d8cff', glyph: '🚀', displayName: { ru: 'Космическая Опера', en: 'Space Opera' }, mentor: { name: { ru: 'Бортовой ИИ', en: 'Ship AI' }, glyph: '🛰️' }, decoder: { ru: 'Твой мир — Космическая Опера: тебя зовут кадетом, задания — миссии, ошибки — аномалии, наставник — Бортовой ИИ. Это лишь декорация — под ней обычный курс.', en: "Your world is Space Opera: you're the cadet, tasks are missions, mistakes are anomalies, your mentor is the Ship AI. It's just decoration — underneath is a normal course." } },
  'anime-quest':   { skin: 'anime-quest',   accent: '#ff7ace', glyph: '🎌', displayName: { ru: 'Аниме-Квест', en: 'Anime Quest' }, mentor: { name: { ru: 'Сэнсэй', en: 'Sensei' }, glyph: '🥋' }, decoder: { ru: 'Твой мир — Аниме-Квест: уроки — арки и битвы, наставник — Сэнсэй. Это лишь подача — под ней обычный курс.', en: "Your world is Anime Quest: lessons are arcs and battles, your mentor is the Sensei. It's just presentation — underneath is a normal course." } },
  'soviet-heroic': { skin: 'soviet-heroic', accent: '#e0b020', glyph: '🏛', displayName: { ru: 'Советский Героизм', en: 'Soviet Heroic' }, mentor: { name: { ru: 'Бригадир', en: 'The Foreman' }, glyph: '🔧' }, decoder: { ru: 'Твой мир — Советский Героизм: курс — производственный план, наставник — Бригадир. Это лишь стилистика — под ней обычный курс.', en: "Your world is Soviet Heroic: the course is a production plan, your mentor is the Foreman. It's just styling — underneath is a normal course." } },
  'mystic-arcane': { skin: 'mystic-arcane', accent: '#b388ff', glyph: '🔮', displayName: { ru: 'Мистическая Аркана', en: 'Mystic Arcane' }, mentor: { name: { ru: 'Оракул', en: 'The Oracle' }, glyph: '🔮' }, decoder: { ru: 'Твой мир — Мистическая Аркана: навыки — руны и заклинания, наставник — Оракул. Это лишь образность — под ней обычный курс.', en: "Your world is Mystic Arcane: skills are runes and spells, your mentor is the Oracle. It's just imagery — underneath is a normal course." } },
  'wanderer':      { skin: 'wanderer',      accent: '#00d1ff', glyph: '🌀', displayName: { ru: 'Странник', en: 'Wanderer' }, mentor: { name: { ru: 'Проводник', en: 'Guide' }, glyph: '🧭' }, decoder: { ru: 'Твой мир — Странник: спокойный нейтральный стиль, наставник — Проводник. Под ним — обычный курс, без лишней мишуры.', en: "Your world is Wanderer: a calm, neutral style, your mentor is the Guide. Underneath is a normal course, with no extra frills." } },
}

export function skinDecoder(skin: WorldSkin, locale: Locale): string {
  const meta = SKINS_META[skin]
  if (meta?.decoder) return meta.decoder[locale]
  // fallback для будущих скинов без явного decoder
  const name = meta?.displayName[locale] ?? skin
  const mentor = meta?.mentor?.name[locale]
  return locale === 'en'
    ? `Your world is ${name}: it's just styling — underneath is a normal course${mentor ? `; your mentor is ${mentor}` : ''}.`
    : `Твой мир — ${name}: это лишь оформление, под ним обычный курс${mentor ? `, наставник — ${mentor}` : ''}.`
}
