import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, 'academy-page.tsx'), 'utf8')
const ruRoute = readFileSync(join(HERE, '..', 'app', 'academy', 'page.tsx'), 'utf8')
const enRoute = readFileSync(join(HERE, '..', 'app', 'en', 'academy', 'page.tsx'), 'utf8')
const sitemap = readFileSync(join(HERE, '..', 'app', 'sitemap.ts'), 'utf8')

const BANNED = /скидк|осталось всего|только сегодня|отзыв|testimonial|discount|hurry|limited|countdown/i

describe('AcademyPage', () => {
  it('is registry- and dictionary-driven', () => {
    expect(src).toContain('getCourses')
    expect(src).toContain('getDictionary')
    expect(src).not.toMatch(/Точка Сборки|Tochka Sborki/)
  })

  it('live cards link out safely, coming-soon stays unlinked', () => {
    expect(src).toMatch(/status === 'live'/)
    expect(src).toContain('rel="noopener noreferrer"')
    expect(src).toContain('aria-label')
  })

  it('authenticity: no hustle lexicon in the page source', () => {
    expect(src).not.toMatch(BANNED)
  })
})

describe('routes + sitemap', () => {
  it('ru and en routes render AcademyPage', () => {
    expect(ruRoute).toContain('<AcademyPage locale="ru" />')
    expect(enRoute).toContain('<AcademyPage locale="en" />')
  })

  it('sitemap lists /academy/', () => {
    expect(sitemap).toContain('/academy/')
  })
})
