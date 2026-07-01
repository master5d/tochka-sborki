import { describe, it, expect } from 'vitest'
import { buildResearchPrompt } from './research'
import { lintDehustle } from './dehustle'

const base = {
  courseName: 'Точка Сборки', moduleTitle: 'Знакомство',
  unitTitle: 'Пять клонов', objective: 'Понять устройство пяти AI-двойников',
}

describe('buildResearchPrompt', () => {
  it('embeds course/module/unit/objective and all five labels (ru)', () => {
    const p = buildResearchPrompt({ ...base, locale: 'ru' })
    for (const s of ['Точка Сборки', 'Знакомство', 'Пять клонов', 'Понять устройство пяти AI-двойников',
      'CONCEPTS:', 'HOOK:', 'MISCONCEPTION:', 'PRACTICE:', 'SOURCES:']) {
      expect(p).toContain(s)
    }
  })
  it('differs by locale and both are de-hustle clean', () => {
    const ru = buildResearchPrompt({ ...base, locale: 'ru' })
    const en = buildResearchPrompt({ ...base, locale: 'en' })
    expect(ru).not.toBe(en)
    expect(lintDehustle(ru)).toEqual([])
    expect(lintDehustle(en)).toEqual([])
  })
  it('names the mental/no-write constraint for the activation hook', () => {
    expect(buildResearchPrompt({ ...base, locale: 'en' })).toMatch(/write|type/i)
    expect(buildResearchPrompt({ ...base, locale: 'ru' })).toMatch(/писать|печат/i)
  })
})
