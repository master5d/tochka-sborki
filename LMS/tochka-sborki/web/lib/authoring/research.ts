// lib/authoring/research.ts
// S2 of the course-authoring engine: emit a per-lesson research PROMPT the author runs
// in their own agent (mirrors learn-prompt.ts / sovereign BYO ethos — no live LLM call),
// and (Task 2) parse the returned notes for the S3 draft stage. Pure, no I/O.
import type { Locale } from '@/lib/dictionaries'

export interface ResearchNotes {
  concepts: string[]     // key concepts to teach (CONCEPT phase)
  hook: string           // bisociative/analogy seed for ACTIVATION (mental, not "write")
  misconception: string  // a common wrong mental model to pre-empt
  practice: string       // a concrete applied-step seed for PRACTICE
  sources: string[]      // 2–3 credible things to verify against
}

export interface ResearchInput {
  courseName: string
  moduleTitle: string
  unitTitle: string
  objective: string
  locale: Locale
}

/** A de-hustled, bilingual, pedagogy-encoded research prompt for the author's own agent. */
export function buildResearchPrompt(i: ResearchInput): string {
  if (i.locale === 'en') {
    return [
      `You are helping me research one lesson of my course "${i.courseName}" — honest, calm, no selling.`,
      `Module: "${i.moduleTitle}". Lesson: "${i.unitTitle}". Objective: ${i.objective}`,
      ``,
      `Research the lesson toward that objective. I teach in a four-phase rhythm (activation → reflection → concept → practice); the activation hook is a BISOCIATIVE, purely mental image — never ask the learner to write or type.`,
      ``,
      `Reply in EXACTLY this labeled format, nothing else:`,
      `CONCEPTS:`,
      `- <key concept, short sentence>`,
      `- <key concept, short sentence>`,
      `HOOK: <one mental bisociative image that opens the lesson — no "write"/"type">`,
      `MISCONCEPTION: <one common wrong mental model to pre-empt>`,
      `PRACTICE: <one concrete applied step the learner does for real>`,
      `SOURCES:`,
      `- <credible source to verify against>`,
      `- <credible source to verify against>`,
    ].join('\n')
  }
  return [
    `Помоги мне исследовать один урок моего курса «${i.courseName}» — честно, спокойно, без продаж.`,
    `Модуль: «${i.moduleTitle}». Урок: «${i.unitTitle}». Цель: ${i.objective}`,
    ``,
    `Исследуй урок под эту цель. Я преподаю в четырёхфазном ритме (активация → рефлексия → концепт → практика); хук активации — БИСОЦИАТИВНЫЙ, чисто мысленный образ — никогда не проси ученика писать или печатать.`,
    ``,
    `Ответь СТРОГО в этом размеченном формате, без лишнего:`,
    `CONCEPTS:`,
    `- <ключевой концепт, короткое предложение>`,
    `- <ключевой концепт, короткое предложение>`,
    `HOOK: <один мысленный бисоциативный образ, открывающий урок — без «напиши»/«печатай»>`,
    `MISCONCEPTION: <одна частая ошибочная ментальная модель, которую надо предупредить>`,
    `PRACTICE: <один конкретный прикладной шаг, который ученик делает по-настоящему>`,
    `SOURCES:`,
    `- <надёжный источник для проверки>`,
    `- <надёжный источник для проверки>`,
  ].join('\n')
}
