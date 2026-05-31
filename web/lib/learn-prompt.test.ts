import { describe, it, expect } from 'vitest'
import { buildLearnPrompt } from './learn-prompt'

const base = {
  locale: 'ru' as const,
  moduleTitle: 'Промпт-инжиниринг',
  unitIndex: 1,
  totalUnits: 3,
}

describe('buildLearnPrompt', () => {
  it('embeds co-thinking identity, Kolb, bisociation, and the 5-step loop', () => {
    const p = buildLearnPrompt(base)
    expect(p).toContain('co-thinking')
    expect(p).toMatch(/Колб/)
    expect(p).toMatch(/бисоциаци/)
    expect(p).toContain('intent')
    expect(p).toContain('системное мышление')
    expect(p).toContain('дизайн-мышление')
    expect(p).toContain('todo')
    expect(p).toContain('юнит 2 из 3')
  })

  it('fills profile slots when present (skin, mentor, niche, outcome)', () => {
    const p = buildLearnPrompt({ ...base, skinName: 'Кибер-Нуар', mentorName: 'Фиксер', niche: 'coach', outcome: 'выйти на первых клиентов' })
    expect(p).toContain('«Кибер-Нуар»')
    expect(p).toContain('Фиксер')
    expect(p).toContain('коучинг')
    expect(p).toContain('выйти на первых клиентов')
  })

  it('mode changes the scaffolding directive', () => {
    const cmd = buildLearnPrompt({ ...base, mode: 'commander' })
    const arch = buildLearnPrompt({ ...base, mode: 'archmage' })
    expect(cmd).toMatch(/максимум опор/)
    expect(arch).toMatch(/Минимум опор/)
    expect(cmd).not.toEqual(arch)
  })

  it('attaches the applied challenge when given', () => {
    const p = buildLearnPrompt({ ...base, appliedChallenge: 'Собери промпт под свою задачу.' })
    expect(p).toContain('Собери промпт под свою задачу.')
  })

  it('produces an English variant', () => {
    const p = buildLearnPrompt({ ...base, locale: 'en', mode: 'copilot' })
    expect(p).toContain('co-think')
    expect(p).toContain('Kolb')
    expect(p).toMatch(/unit 2 of 3/)
  })
})
