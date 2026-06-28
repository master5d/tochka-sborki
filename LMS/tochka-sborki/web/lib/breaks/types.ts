// lib/breaks/types.ts
// Trigger-engine types for the dopamine-break interstitial (fb_a03db93a5bbe).
// `Bi` is module-local by convention (see lib/course/office-hours.ts); only Locale is imported.
interface Bi { ru: string; en: string }

export interface BreakActivity {
  key: string
  title: Bi
  prompt: Bi
  cta?: Bi
}

export interface ResolvedBreak {
  key: string
  title: string
  prompt: string
  cta: string
}

export interface BreakContext {
  availableCount: number
  currentStep: number
  stepsSinceLastBreak: number
  breaksShownThisSession: number
  restMode: boolean
}
