import { describe, it, expect } from 'vitest'
import { buildCompanionCharter } from './charter'

describe('buildCompanionCharter', () => {
  it('fills the 7 blocks from a v2 profile', () => {
    const c = buildCompanionCharter({
      locale: 'ru', skinName: 'Кибер-Нуар', mentorName: 'Фиксер', niche: 'coach',
      outcome: 'выйти на первых клиентов', mbti: 'INFP',
      relational: { rhythm: 'suave', errorStyle: 'soft_feedback', anchor: 'support', attention: 'short' },
    })
    expect(c).toContain('Identity')
    expect(c).toContain('Goal')
    expect(c).toContain('выйти на первых клиентов')
    expect(c).toContain('INFP')
  })
  it('degrades when fields are missing', () => {
    const c = buildCompanionCharter({ locale: 'en' })
    expect(c).toContain('Identity')
    expect(c).toContain('Goal')
  })
})
