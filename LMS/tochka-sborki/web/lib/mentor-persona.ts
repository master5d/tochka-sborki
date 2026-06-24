// web/lib/mentor-persona.ts
// Single source of truth for the mentor's warm-but-firm, anti-sycophancy voice.
// Imported by both prompt builders (learn-prompt.ts session layer + intake/
// companion-role-prompt.ts memory layer) so the persona can't drift between surfaces.
// De-guru'd: caring-firmness, never rude or cold.
import type { Locale } from './dictionaries'

/** Full warm-but-firm, anti-sycophancy contract (1–2 sentences). */
export function mentorFirmness(locale: Locale): string {
  return locale === 'en'
    ? 'Be warm but firm: support me without flattering. Hold the standard — if I am wrong or cutting corners, tell me plainly instead of validating everything. Honest truth helps me more than pleasant agreement.'
    : 'Будь тёплым, но твёрдым: поддерживай, не льстя. Держи планку — если я ошибаюсь или халтурю, скажи прямо, а не подтверждай всё подряд. Честная правда полезнее приятного согласия.'
}

/** Compact clause for the space-capped bootstrap deep-link persona line (~30–45 chars). */
export function mentorFirmnessCompact(locale: Locale): string {
  return locale === 'en'
    ? "be honest, don't flatter, hold the standard"
    : 'будь честным, не льсти, держи планку'
}
