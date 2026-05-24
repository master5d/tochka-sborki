// web/lib/cs/applied-challenge.ts
import type { ChallengeTier, IntakeLite } from './types'
import type { Locale } from '@/lib/intake/types'
import { CHALLENGE_TEMPLATES } from './challenge-templates'

const NICHE_FALLBACK: Record<Locale, string> = { ru: 'твоей сфере', en: 'your field' }

function clean(v?: string | null): string | null {
  const t = v?.trim()
  return t ? t : null
}

// Shared {niche}/{outcome} slot-fill: {niche} → value or the locale fallback word; {outcome} → value or ''.
export function fillNicheSlots(text: string, niche: string | null, outcome: string | null, locale: Locale): string {
  const n = clean(niche)
  const o = clean(outcome)
  return text.replace(/\{niche\}/g, n ?? NICHE_FALLBACK[locale]).replace(/\{outcome\}/g, o ?? '')
}

export function getAppliedChallenge(
  profile: IntakeLite,
  moduleSlug: string,
  tier: ChallengeTier,
  locale: Locale,
): string | null {
  const tmpl = CHALLENGE_TEMPLATES[moduleSlug]
  if (!tmpl) return null

  const niche = clean(profile.niche)
  const outcome = clean(profile.outcome)

  let line: string
  if (tier === 'task') {
    line = tmpl.task[locale]
  } else if (tier === 'process') {
    line = tmpl.process[locale]
  } else {
    if (outcome) line = tmpl.outcome[locale]
    else if (niche) line = tmpl.outcomeGeneric[locale]
    else line = tmpl.task[locale]
  }

  return fillNicheSlots(line, profile.niche ?? null, profile.outcome ?? null, locale)
}
