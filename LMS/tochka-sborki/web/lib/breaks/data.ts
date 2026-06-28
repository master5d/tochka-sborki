// lib/breaks/data.ts
// Dark-ship break content: BREAKS stays empty until the owner adds activities via
// fb_282cf1c678f7. With BREAKS empty, the trigger never fires (see shouldBreak gate 1).
import type { Locale } from '@/lib/intake/types'
import type { BreakActivity, ResolvedBreak } from './types'

export const BREAKS: BreakActivity[] = []

const DEFAULT_CTA: Record<Locale, string> = { ru: 'Продолжить', en: 'Continue' }

export function resolveBreaks(locale: Locale, source: BreakActivity[] = BREAKS): ResolvedBreak[] {
  return source.map(b => ({
    key: b.key,
    title: b.title[locale],
    prompt: b.prompt[locale],
    cta: b.cta ? b.cta[locale] : DEFAULT_CTA[locale],
  }))
}
