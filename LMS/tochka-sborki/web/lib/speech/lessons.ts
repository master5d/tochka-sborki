// lib/speech/lessons.ts
// Проза уроков ораторского курса. Отдельно от course.ts (там структура).
// Ключ = slug урока из SPEECH_COURSE.
// ⚠ Копирайт: корпус владельца (Карнеги, Леммерман) — только как ориентир темы;
// текст оригинальный, фундамент public-domain (классическая риторика). Ни строки
// из современных авторов (шрам OpenYoga). Проза проходит lintDehustle.
// Пустая строка = урок ещё не написан: страница урока такой slug не создаёт.
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export const SPEECH_PROSE: Record<string, Bi> = {}

/** Проза урока на нужном языке или null, если урок ещё не написан. */
export function getSpeechProse(slug: string, locale: Locale): string | null {
  const body = SPEECH_PROSE[slug]?.[locale]?.trim()
  return body ? body : null
}

/** Slug'и уроков, у которых есть проза на обоих языках (для generateStaticParams). */
export function writtenSpeechSlugs(): string[] {
  return Object.entries(SPEECH_PROSE)
    .filter(([, bi]) => bi.ru.trim().length > 0 && bi.en.trim().length > 0)
    .map(([slug]) => slug)
}
