import { describe, it, expect } from 'vitest'
import { BREAKS, resolveBreaks } from './data'
import type { BreakActivity } from './types'

const sample: BreakActivity[] = [
  { kind: 'passive', key: 'breathe', title: { ru: 'Пауза', en: 'Pause' }, prompt: { ru: 'Сделай вдох', en: 'Take a breath' } },
  { kind: 'passive', key: 'look', title: { ru: 'Взгляд', en: 'Look' }, prompt: { ru: 'Посмотри вдаль', en: 'Look far' }, cta: { ru: 'Дальше', en: 'Onward' } },
]

const puzzle: BreakActivity = {
  kind: 'puzzle',
  key: 'glass',
  title: { ru: 'Паззл', en: 'Puzzle' },
  question: { ru: 'Какой стакан наполнится первым?', en: 'Which glass fills first?' },
  choices: [
    { ru: 'Первый', en: 'First' },
    { ru: 'Третий', en: 'Third' },
  ],
  answer: 1,
  reveal: { ru: 'Труба к третьему открыта', en: 'The pipe to the third is open' },
}

describe('resolveBreaks', () => {
  it('returns [] when BREAKS is empty (dark-ship default)', () => {
    expect(BREAKS).toEqual([])
    expect(resolveBreaks('ru')).toEqual([])
    expect(resolveBreaks('en')).toEqual([])
  })

  it('maps passive Bi fields to the active locale', () => {
    expect(resolveBreaks('en', sample)[0]).toEqual({
      kind: 'passive', key: 'breathe', title: 'Pause', prompt: 'Take a breath', cta: 'Continue',
    })
    const ru0 = resolveBreaks('ru', sample)[0]
    expect(ru0.title).toBe('Пауза')
    expect(ru0.kind === 'passive' && ru0.prompt).toBe('Сделай вдох')
  })

  it('applies default cta only when cta is omitted (passive)', () => {
    const r = resolveBreaks('ru', sample)
    expect(r[0].cta).toBe('Продолжить') // omitted -> locale default
    expect(r[1].cta).toBe('Дальше')     // provided -> used verbatim
  })

  it('resolves a puzzle activity: localized question/choices/reveal, answer index preserved', () => {
    const r = resolveBreaks('en', [puzzle])[0]
    expect(r).toEqual({
      kind: 'puzzle',
      key: 'glass',
      title: 'Puzzle',
      question: 'Which glass fills first?',
      choices: ['First', 'Third'],
      answer: 1,
      reveal: 'The pipe to the third is open',
      cta: 'Continue',
    })
    const ru = resolveBreaks('ru', [puzzle])[0]
    expect(ru.kind === 'puzzle' && ru.choices).toEqual(['Первый', 'Третий'])
    expect(ru.kind === 'puzzle' && ru.question).toBe('Какой стакан наполнится первым?')
    expect(ru.cta).toBe('Продолжить')
  })

  it('resolves a mixed source by kind', () => {
    const r = resolveBreaks('en', [sample[0], puzzle])
    expect(r[0].kind).toBe('passive')
    expect(r[1].kind).toBe('puzzle')
  })
})
