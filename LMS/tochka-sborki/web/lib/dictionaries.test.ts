import { describe, expect, it } from 'vitest'
import { getDictionary } from './dictionaries'

const ru = getDictionary('ru')
const en = getDictionary('en')

describe('value-clarity dictionary parity (fb_8423715c58e2)', () => {
  it('chatVsSystem has 4 rows in both locales', () => {
    expect(ru.chatVsSystem.rows).toHaveLength(4)
    expect(en.chatVsSystem.rows).toHaveLength(ru.chatVsSystem.rows.length)
  })

  it('beforeAfter has 3 items in both locales', () => {
    expect(ru.beforeAfter.items).toHaveLength(3)
    expect(en.beforeAfter.items).toHaveLength(ru.beforeAfter.items.length)
  })

  it('dreams has 6 items in both locales', () => {
    expect(ru.dreams.items).toHaveLength(6)
    expect(en.dreams.items).toHaveLength(ru.dreams.items.length)
  })

  it('faq includes the three objection pairs in both locales', () => {
    expect(ru.faq.items).toHaveLength(7)
    expect(en.faq.items).toHaveLength(7)
  })

  it('hero subtitle carries the spine (no jargon)', () => {
    expect(ru.hero.subtitle).toContain('доводит до конца')
    expect(en.hero.subtitle).toContain('carries to the finish')
    for (const s of [ru.hero.subtitle, en.hero.subtitle]) {
      expect(s).not.toMatch(/MCP|agentic|оркестрац|orchestrat/i)
    }
  })
})
