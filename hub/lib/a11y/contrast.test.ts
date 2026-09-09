import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'

const CSS = readFileSync(join(process.cwd(), 'themes', 'model-kit.css'), 'utf8')
const LAYOUT = readFileSync(join(process.cwd(), 'app', 'layout.tsx'), 'utf8')

/** Токены одного CSS-блока по его селектору. */
function tokensOf(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector)
  if (start < 0) throw new Error(`блок ${selector} не найден в model-kit.css`)
  const open = CSS.indexOf('{', start)
  const close = CSS.indexOf('}', open)
  const body = CSS.slice(open + 1, close)
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

const NEEDED = ['--bg-primary', '--text-primary', '--text-secondary', '--text-accent'] as const

describe('hub theme contrast', () => {
  // Шов, который уже ломался: провайдер ставил class="dark", а токены живут
  // в [data-theme] — селекторы не совпадали и страница уходила в чёрное по чёрному.
  it('ThemeProvider writes the same attribute the CSS listens to', () => {
    // Смотрим на сам проп в теге, а не на любое упоминание в файле:
    // иначе тест ловит собственный комментарий про историю бага.
    const tag = LAYOUT.match(/<ThemeProvider[^>]*>/)?.[0] ?? ''
    expect(tag, 'тег <ThemeProvider> не найден').not.toBe('')
    expect(tag).toContain('attribute="data-theme"')
    expect(tag).not.toContain('attribute="class"')
    expect(CSS).toContain('[data-theme="dark"]')
    expect(CSS).toContain('[data-theme="light"]')
  })

  // Статический экспорт отдаёт HTML без data-theme: до гидрации страницу красит
  // именно :root, поэтому он обязан нести полный набор токенов.
  it('bare :root carries readable defaults (no-JS / pre-hydration)', () => {
    const root = tokensOf(':root {')
    for (const token of NEEDED) {
      expect(root[token], `:root ${token}`).toBeTruthy()
      expect(root[token]).toMatch(/^#[0-9a-f]{3,8}$/i)
    }
    expect(contrastRatio(root['--text-primary'], root['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(root['--text-secondary'], root['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
  })

  it('system-dark fallback stays readable too', () => {
    const dark = tokensOf(':root:not([data-theme])')
    expect(contrastRatio(dark['--text-primary'], dark['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(dark['--text-secondary'], dark['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
  })

  it.each([['[data-theme="dark"]'], ['[data-theme="light"]']])('%s meets WCAG AA', (selector) => {
    const t = tokensOf(selector)
    expect(contrastRatio(t['--text-primary'], t['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t['--text-secondary'], t['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t['--text-primary'], t['--bg-surface'])).toBeGreaterThanOrEqual(4.5)
  })
})

const QUEST = readFileSync(join(process.cwd(), 'themes', 'quest.css'), 'utf8')
const TINTS = ['hero', 'intro', 'fork1', 'fork2', 'fork3', 'finale', 'about'].map((k) => `--quest-tint-${k}`)

function questTokensOf(selector: string): Record<string, string> {
  const start = QUEST.indexOf(selector)
  if (start < 0) throw new Error(`блок ${selector} не найден в quest.css`)
  const open = QUEST.indexOf('{', start)
  const close = QUEST.indexOf('}', open)
  const out: Record<string, string> = {}
  for (const m of QUEST.slice(open + 1, close).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

describe('quest chapter tints', () => {
  const cases: Array<[string, string, string]> = [
    [':root {', ':root {', 'light fallback'],
    [':root:not([data-theme])', ':root:not([data-theme])', 'system dark'],
    ['[data-theme="dark"]', '[data-theme="dark"]', 'explicit dark'],
    ['[data-theme="light"]', '[data-theme="light"]', 'explicit light'],
  ]
  for (const [questSel, kitSel, name] of cases) {
    it(`${name}: text stays readable on every tint`, () => {
      const tint = questTokensOf(questSel)
      const kit = tokensOf(kitSel)
      for (const t of TINTS) {
        expect(tint[t], `${questSel} ${t}`).toMatch(/^#[0-9a-f]{6}$/i)
        expect(contrastRatio(kit['--text-primary'], tint[t]), `${name} primary on ${t}`).toBeGreaterThanOrEqual(4.5)
        expect(contrastRatio(kit['--text-secondary'], tint[t]), `${name} secondary on ${t}`).toBeGreaterThanOrEqual(3.0)
        expect(contrastRatio(kit['--text-accent'], tint[t]), `${name} accent on ${t}`).toBeGreaterThanOrEqual(4.5)
      }
      expect(contrastRatio(kit['--text-accent'], tint['--quest-card']), `${name} accent on --quest-card`).toBeGreaterThanOrEqual(4.5)
    })
  }
})

// The hero's copy panel (`.quest-hero-copy`, themes/quest.css) is painted solid from
// `--quest-tint-hero` — no scrim over the art. This is the same token already covered
// by the loop above (it's in TINTS), asserted again here under its own name so the
// hero-panel guarantee reads as a guarantee, not a side effect of the tint loop.
describe('quest hero panel contrast (no scrim — token vs token)', () => {
  const cases: Array<[string, string, string]> = [
    [':root {', ':root {', 'light fallback'],
    [':root:not([data-theme])', ':root:not([data-theme])', 'system dark'],
    ['[data-theme="dark"]', '[data-theme="dark"]', 'explicit dark'],
    ['[data-theme="light"]', '[data-theme="light"]', 'explicit light'],
  ]
  for (const [questSel, kitSel, name] of cases) {
    it(`${name}: hero copy text stays readable on --quest-tint-hero`, () => {
      const tint = questTokensOf(questSel)
      const kit = tokensOf(kitSel)
      const panel = tint['--quest-tint-hero']
      expect(contrastRatio(kit['--text-primary'], panel), `${name} primary on hero panel`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(kit['--text-accent'], panel), `${name} accent on hero panel`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(kit['--text-secondary'], panel), `${name} secondary on hero panel`).toBeGreaterThanOrEqual(3.0)
    })
  }
})
