import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
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

const SERVICE = [/\[scene:/, /\[loop:/, /\[сцена:/, /\[петля:/, /Service header/, /Служебная шапка/, /CTA:\s*\*\*/, /\*\*/]

function ctasOf(c: QuestContent) {
  return [
    ...c.forks.flatMap((f) => [...(f.cta ? [f.cta] : []), ...(f.detour.ctas ?? [])]),
    c.finale.cta,
    c.about.author.cta,
  ]
}

/**
 * G1's hole: the leaked `[loop: …]` stage directions ("sparks rise from the
 * fire, the phone screen blinks with notifications") lived in a `captions`
 * data map next to the narrative, so this file's own `strings(c)` walk over
 * `quest[loc]` DID pass over them — the miss was the regex list, not the
 * reach. A guard scoped to `quest[loc]` still only ever proves ONE module
 * (content.ts) clean; a service mark authored straight into a component's
 * JSX (a road-strip label, a hardcoded plaque string, a new data module this
 * file never imports) would sail through it exactly the same way. So this
 * walk is over every non-test `.ts`/`.tsx` file under `lib/quest` and
 * `components/quest` — the whole surface the page actually renders from,
 * regardless of which module a string lives in.
 */
function questModuleFiles(): string[] {
  const roots = [join(process.cwd(), 'lib', 'quest'), join(process.cwd(), 'components', 'quest')]
  const out: string[] = []
  for (const root of roots) {
    for (const name of readdirSync(root)) {
      if (!/\.(ts|tsx)$/.test(name) || name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue
      out.push(join(root, name))
    }
  }
  return out
}

/** Block comments (`/** ... *\/`, JSDoc included) are where the SERVICE list's
 *  own markdown-bold check (`**`) and the bracket-tag examples in doc comments
 *  (like the one just above this function, or content.ts's now-removed one)
 *  would false-positive — they document the shape, they don't render it. Line
 *  comments are left alone: none in this tree carry these shapes (checked),
 *  and stripping them risks truncating a `https://` href at its `//`. */
function stripBlockComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('quest rendered surface carries no service marks (any module)', () => {
  const files = questModuleFiles()
  it('found the quest source files (guard against an empty, always-green walk)', () => {
    expect(files.length).toBeGreaterThan(10)
  })
  for (const file of files) {
    it(`${file.slice(process.cwd().length + 1)}: no service-mark shape in source`, () => {
      const text = stripBlockComments(readFileSync(file, 'utf8'))
      for (const re of SERVICE) expect(text, `service mark ${re} in ${file}`).not.toMatch(re)
    })
  }
  it('the loop-caption feature (G1) stays removed: no prop, class, or content-map remnant', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text, `loopCaption remnant in ${file}`).not.toMatch(/loopCaption|loop-caption/)
    }
  })
  /**
   * Wave I: a fork chapter's sticky scene depicts the OBSTACLE, not either
   * road — the two path cards (each with its own guide chip) and the road
   * strips already name the road, so a caption on the scene that names one
   * road while the card beside it names the other is a false statement about
   * the picture, not a label. The fix removed the `caption` prop/class
   * entirely rather than making it track the active step (there is nothing
   * true and useful for it to say), so the guard is the same shape as the
   * loop-caption one above: the feature — and specifically its pairing with
   * either road label — must stay gone, not just quiet.
   */
  it('Wave I: no fork scene caption remains, and neither road label is ever paired with one', () => {
    const roadLabels = LOCALES.flatMap((loc) => [quest[loc].labels.habit, quest[loc].labels.detour])
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text, `caption prop/class remnant in ${file}`).not.toMatch(/\bcaption\b\s*[?:=]|quest-scene__caption/)
      let idx = text.indexOf('caption')
      while (idx !== -1) {
        const nearby = text.slice(idx, idx + 60)
        for (const label of roadLabels) {
          expect(nearby, `caption paired with "${label}" in ${file}`).not.toContain(label)
        }
        idx = text.indexOf('caption', idx + 1)
      }
    }
  })
})

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
        expect(f.outcomes[0].source, 'scroller outcome must carry a source').toBeDefined()
        for (const o of f.outcomes) if (o.source !== undefined) expect(o.source.length).toBeGreaterThan(5)
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
