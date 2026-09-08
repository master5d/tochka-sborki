import { describe, expect, it } from 'vitest'
import { quest, type QuestContent } from './content'

const LOCALES = ['ru', 'en'] as const

/** Every string in the content tree, depth-first. */
function strings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach((n) => strings(n, out))
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => strings(n, out))
  return out
}

const FACTS: Record<'ru' | 'en', RegExp[]> = {
  en: [/18 hours 36 minutes/, /2 hours 39 minutes/, /1 hour 47 minutes/, /9 modules/, /44 lessons/, /8\.9 hours/, /38 %/, /46 %/, /84 %/, /3\.1 %/, /3\.13 %/],
  ru: [/18 часов 36 минут/, /2 часов 39 минут/, /1 час 47 минут/, /9 модулей/, /44 урок/, /8,9 часа/, /38 %/, /46 %/, /84 %/, /3,1 %/, /3,13 %/],
}

const SERVICE = [/\[scene:/, /\[loop:/, /\[сцена:/, /\[петля:/, /Service header/, /Служебная шапка/, /^CTA:/m, /^\*\*/m]

function ctasOf(c: QuestContent) {
  return [
    ...c.forks.flatMap((f) => [...(f.cta ? [f.cta] : []), ...(f.detour.ctas ?? [])]),
    c.finale.cta,
    c.about.author.cta,
  ]
}

describe('quest content', () => {
  for (const loc of LOCALES) {
    const c = quest[loc]
    const all = strings(c)
    it(`${loc}: carries every sourced fact`, () => {
      const joined = all.join('\n')
      for (const f of FACTS[loc]) expect(joined, `${loc} fact ${f}`).toMatch(f)
    })
    it(`${loc}: no service marks or markdown leaked`, () => {
      for (const s of all) for (const re of SERVICE) expect(s, `service mark in: ${s.slice(0, 60)}`).not.toMatch(re)
      for (const s of all) expect(s, `list marker in: ${s.slice(0, 60)}`).not.toMatch(/^(- |\d+\. )/)
    })
    it(`${loc}: five CTAs with absolute or root-relative hrefs`, () => {
      const ctas = ctasOf(c)
      expect(ctas.length).toBe(5)
      for (const x of ctas) {
        expect(x.label.trim().length).toBeGreaterThan(3)
        expect(x.href).toMatch(/^(https:\/\/|\/)/)
      }
    })
    it(`${loc}: three forks, each with two outcomes from different guides`, () => {
      expect(c.forks.length).toBe(3)
      for (const f of c.forks) {
        expect(f.habit.guide).toBe('scroller')
        expect(f.detour.guide).toBe('builder')
        expect(f.outcomes[0].guide).not.toBe(f.outcomes[1].guide)
        for (const o of f.outcomes) expect(o.source.length).toBeGreaterThan(5)
      }
    })
    it(`${loc}: seo within limits, footer verbatim`, () => {
      expect(c.seo.title.length).toBeLessThanOrEqual(60)
      expect(c.seo.description.length).toBeLessThanOrEqual(155)
      expect(c.footer).toBe('© 2026 · mamaev.coach · ⬡ vibe in motion')
    })
    it(`${loc}: scenes are wired in narrative order`, () => {
      expect([c.hero.scene, c.intro.scene, ...c.forks.map((f) => f.scene), c.finale.scene, c.about.scene])
        .toEqual(['01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'])
    })
  }
})
