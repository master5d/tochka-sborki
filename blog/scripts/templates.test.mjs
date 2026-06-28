import { describe, it, expect } from 'vitest'
import { componentName, componentSource, routeSource, registryStub } from './templates.mjs'

describe('componentName', () => {
  it('kebab → PascalCase', () => {
    expect(componentName('nervous-strength')).toBe('NervousStrength')
    expect(componentName('idea')).toBe('Idea')
  })
})

describe('componentSource', () => {
  it('post: exports the component, both locales, 3 sections', () => {
    const s = componentSource('my-essay', 'post')
    expect(s).toContain('export function MyEssay(')
    expect(s).toContain("if (locale === 'en')")
    expect(s).toContain('styles.lead')
    expect((s.match(/<h2>/g) ?? []).length).toBe(6) // 3 per locale
  })
  it('note: short body, dense-related reminder, no sections', () => {
    const s = componentSource('atom', 'note')
    expect(s).toContain('export function Atom(')
    expect(s).toContain('related[]')
    expect(s).not.toContain('<h2>')
  })
})

describe('routeSource', () => {
  it('ru route wires getPost + locale + ru_RU', () => {
    const s = routeSource('atom', 'ru')
    expect(s).toContain("getPost('atom')")
    expect(s).toContain('locale="ru"')
    expect(s).toContain('ru_RU')
    expect(s).toContain('export default function AtomPage(')
  })
  it('en route uses the /en/ url + En suffix + en_US', () => {
    const s = routeSource('atom', 'en')
    expect(s).toContain('https://mamaev.coach/en/blog/atom/')
    expect(s).toContain('export default function AtomPageEn(')
    expect(s).toContain('en_US')
  })
})

describe('registryStub', () => {
  it('note stub carries slug + kind', () => {
    const s = registryStub('atom', 'note')
    expect(s).toContain("slug: 'atom'")
    expect(s).toContain("kind: 'note'")
  })
  it('post stub omits the kind line', () => {
    expect(registryStub('essay', 'post')).not.toContain('kind:')
  })
})
