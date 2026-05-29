import { describe, it, expect } from 'vitest'
import { phaseLabel, phaseMarker, PHASE_META } from './phase-chrome'

describe('phase-chrome', () => {
  it('localizes phase chip labels', () => {
    expect(phaseLabel('activation', 'ru')).toBe('Активация')
    expect(phaseLabel('activation', 'en')).toBe('Activation')
    expect(phaseLabel('practice', 'en')).toBe('Practice')
    expect(phaseLabel('reflection', 'ru')).toBe('Рефлексия')
  })
  it('shows the mental marker only for activation and reflection', () => {
    expect(phaseMarker('activation', 'ru')).toMatch(/в уме/)
    expect(phaseMarker('reflection', 'en')).toMatch(/in your head/)
    expect(phaseMarker('concept', 'ru')).toBeNull()
    expect(phaseMarker('practice', 'en')).toBeNull()
  })
  it('keeps the existing icons and colors', () => {
    expect(PHASE_META.activation.icon).toBe('⚡')
    expect(PHASE_META.activation.color).toBe('var(--phase-1)')
  })
})
