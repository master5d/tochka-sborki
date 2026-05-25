import type { Locale } from '@/lib/dictionaries'

export type PhaseType = 'activation' | 'reflection' | 'concept' | 'practice'

export const PHASE_META: Record<PhaseType, { label: Record<Locale, string>; icon: string; color: string }> = {
  activation: { label: { ru: 'Активация', en: 'Activation' }, icon: '⚡', color: '#00ff88' },
  reflection: { label: { ru: 'Рефлексия', en: 'Reflection' }, icon: '👁', color: '#00aaff' },
  concept:    { label: { ru: 'Концепция', en: 'Concept' },    icon: '💡', color: '#ff9900' },
  practice:   { label: { ru: 'Практика', en: 'Practice' },    icon: '🛠', color: '#ff44aa' },
}

const MENTAL_MARKER: Record<Locale, string> = {
  ru: '💭 в уме · писать не нужно',
  en: '💭 in your head · nothing to type',
}

const MENTAL_PHASES: ReadonlySet<PhaseType> = new Set<PhaseType>(['activation', 'reflection'])

export function phaseLabel(type: PhaseType, locale: Locale): string {
  return PHASE_META[type].label[locale]
}

export function phaseMarker(type: PhaseType, locale: Locale): string | null {
  return MENTAL_PHASES.has(type) ? MENTAL_MARKER[locale] : null
}
