import { describe, it, expect } from 'vitest'
import { COURSE_MATERIALS, isExternalHref } from './materials'

describe('isExternalHref', () => {
  it('treats http(s) URLs as external and relative paths as internal', () => {
    expect(isExternalHref('https://claude.ai')).toBe(true)
    expect(isExternalHref('http://x.dev')).toBe(true)
    expect(isExternalHref('/cheatsheet/')).toBe(false)
    expect(isExternalHref('/materials/agent-charter.md')).toBe(false)
  })
})

describe('COURSE_MATERIALS manifest', () => {
  it('is non-empty and every group is well-formed', () => {
    expect(COURSE_MATERIALS.length).toBeGreaterThan(0)
    for (const g of COURSE_MATERIALS) {
      expect(g.label.ru.length).toBeGreaterThan(0)
      expect(g.label.en.length).toBeGreaterThan(0)
      expect(g.items.length).toBeGreaterThan(0)
      for (const it of g.items) {
        expect(it.href.length).toBeGreaterThan(0)
        expect(it.title.ru.length).toBeGreaterThan(0)
        expect(it.title.en.length).toBeGreaterThan(0)
      }
    }
  })

  it('marks tool items as external links', () => {
    const tools = COURSE_MATERIALS.flatMap(g => g.items).filter(i => i.kind === 'tool')
    expect(tools.length).toBeGreaterThan(0)
    for (const t of tools) expect(t.external).toBe(true)
  })

  it('keeps external flag consistent with the href', () => {
    for (const it of COURSE_MATERIALS.flatMap(g => g.items)) {
      expect(Boolean(it.external)).toBe(isExternalHref(it.href))
    }
  })
})
