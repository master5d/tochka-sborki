import { describe, it, expect } from 'vitest'
import { BREAKS, resolveBreaks } from './data'
import type { BreakActivity } from './types'

const sample: BreakActivity[] = [
  { key: 'breathe', title: { ru: 'Пауза', en: 'Pause' }, prompt: { ru: 'Сделай вдох', en: 'Take a breath' } },
  { key: 'look', title: { ru: 'Взгляд', en: 'Look' }, prompt: { ru: 'Посмотри вдаль', en: 'Look far' }, cta: { ru: 'Дальше', en: 'Onward' } },
]

describe('resolveBreaks', () => {
  it('returns [] when BREAKS is empty (dark-ship default)', () => {
    expect(BREAKS).toEqual([])
    expect(resolveBreaks('ru')).toEqual([])
    expect(resolveBreaks('en')).toEqual([])
  })

  it('maps Bi fields to the active locale', () => {
    expect(resolveBreaks('en', sample)[0]).toEqual({
      key: 'breathe', title: 'Pause', prompt: 'Take a breath', cta: 'Continue',
    })
    expect(resolveBreaks('ru', sample)[0].title).toBe('Пауза')
    expect(resolveBreaks('ru', sample)[0].prompt).toBe('Сделай вдох')
  })

  it('applies default cta only when cta is omitted', () => {
    const r = resolveBreaks('ru', sample)
    expect(r[0].cta).toBe('Продолжить') // omitted -> locale default
    expect(r[1].cta).toBe('Дальше')     // provided -> used verbatim
  })
})
