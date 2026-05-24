// web/lib/cs/applied-challenge.ts
import type { ChallengeTier, IntakeLite } from './types'
import type { Locale } from '@/lib/intake/types'
import { CHALLENGE_TEMPLATES } from './challenge-templates'

const NICHE_FALLBACK: Record<Locale, string> = { ru: 'твоей сфере', en: 'your field' }

function clean(v?: string | null): string | null {
  const t = v?.trim()
  return t ? t : null
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

  return line
    .replace(/\{niche\}/g, niche ?? NICHE_FALLBACK[locale])
    .replace(/\{outcome\}/g, outcome ?? '')
}
