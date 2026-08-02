// lib/speedreading/lessons.ts
// Проза уроков скорочтения. Отдельно от course.ts (там структура) — чтобы длинный
// markdown не мешал читать скелет курса. Ключ = slug урока из SPEEDREADING_COURSE.
// Методика public-domain, текст оригинальный: ни одной фразы из чужих книг/курсов
// (шрам OpenYoga). Проза проходит lintDehustle — см. lessons.test.ts.
// Пустая строка = урок ещё не написан: страница урока такой slug не создаёт.
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export const SPEEDREADING_PROSE: Record<string, Bi> = {}

/** Проза урока на нужном языке или null, если урок ещё не написан. */
export function getSpeedreadingProse(slug: string, locale: Locale): string | null {
  const body = SPEEDREADING_PROSE[slug]?.[locale]?.trim()
  return body ? body : null
}

/** Slug'и уроков, у которых есть проза на обоих языках (для generateStaticParams). */
export function writtenSpeedreadingSlugs(): string[] {
  return Object.entries(SPEEDREADING_PROSE)
    .filter(([, bi]) => bi.ru.trim().length > 0 && bi.en.trim().length > 0)
    .map(([slug]) => slug)
}
