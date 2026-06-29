// lib/breaks/data.ts
// Dark-ship break content: BREAKS stays empty until the owner adds activities via
// fb_282cf1c678f7. With BREAKS empty, the trigger never fires (see shouldBreak gate 1).
import type { Locale } from '@/lib/intake/types'
import type { BreakActivity, ResolvedBreak } from './types'

export const BREAKS: BreakActivity[] = []

const DEFAULT_CTA: Record<Locale, string> = { ru: 'Продолжить', en: 'Continue' }

export function resolveBreaks(locale: Locale, source: BreakActivity[] = BREAKS): ResolvedBreak[] {
  return source.map(b => {
    const cta = b.cta ? b.cta[locale] : DEFAULT_CTA[locale]
    if (b.kind === 'puzzle') {
      return {
        kind: 'puzzle',
        key: b.key,
        title: b.title[locale],
        question: b.question[locale],
        choices: b.choices.map(c => c[locale]),
        answer: b.answer,
        reveal: b.reveal[locale],
        cta,
      }
    }
    return {
      kind: 'passive',
      key: b.key,
      title: b.title[locale],
      prompt: b.prompt[locale],
      cta,
    }
  })
}
