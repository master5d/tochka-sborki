import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio, hexToRgb } from './contrast'

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

// L2: the outcomes act is a saturated full-width band per fork (the reference's
// "Outcomes" strip). The band colours do not change with the theme — one
// declaration in bare :root — so one assertion per band covers every state.
describe('quest outcomes bands stay readable', () => {
  it('band ink reads on every fork band (≥ 4.5, large display title)', () => {
    const root = questTokensOf(':root {')
    for (const k of ['fork1', 'fork2', 'fork3']) {
      const band = root[`--quest-band-${k}`]
      expect(band, `--quest-band-${k}`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(contrastRatio(root['--quest-band-ink'], band), `ink on --quest-band-${k}`).toBeGreaterThanOrEqual(4.5)
    }
  })
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

// Wave F's corner badge (.quest-scene__quip) paints `--text-primary` on
// `rgba(var(--bg-primary-rgb), 0.85)`, composited over each chapter's tint
// (the badge sits on top of the scene art, which sits on the chapter's tint
// at its edges) rather than tested as an isolated flat colour.
// (Wave F also shipped a sibling `.quest-scene__loop-caption` badge sharing this
// token combo; Wave G removed that feature — see lib/quest/content.test.ts. Wave
// I removed the plain `.quest-scene__caption` road label too — see
// components/quest/quest-home.test.tsx.)
function blendOverTint(bgPrimaryRgb: string, alpha: number, tintHex: string): string {
  const [br, bgc, bb] = bgPrimaryRgb.split(',').map((n) => Number(n.trim()))
  const [tr, tg, tb] = hexToRgb(tintHex)
  const mix = (fg: number, bg: number) => Math.round(fg * alpha + bg * (1 - alpha))
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(mix(br, tr))}${toHex(mix(bgc, tg))}${toHex(mix(bb, tb))}`
}

describe('quest Wave F corner badge (quip) stays readable', () => {
  const cases: Array<[string, string, string]> = [
    [':root {', ':root {', 'light fallback'],
    [':root:not([data-theme])', ':root:not([data-theme])', 'system dark'],
    ['[data-theme="dark"]', '[data-theme="dark"]', 'explicit dark'],
    ['[data-theme="light"]', '[data-theme="light"]', 'explicit light'],
  ]
  for (const [questSel, kitSel, name] of cases) {
    it(`${name}: text-primary on the semi-opaque bg-primary badge clears AA over every tint`, () => {
      const tint = questTokensOf(questSel)
      const kit = tokensOf(kitSel)
      for (const t of TINTS) {
        const composite = blendOverTint(kit['--bg-primary-rgb'], 0.85, tint[t])
        expect(contrastRatio(kit['--text-primary'], composite), `${name} badge on ${t}`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

// Wave F round 2's path-choice control (.quest-path-choice): the UNPRESSED chip
// border is --border-color (non-text, not a contrast-ratio surface); the PRESSED
// state is a solid --text-accent fill with --text-on-accent text — the exact
// pairing .quest-cta already uses, reused rather than inventing a new one, but
// asserted here under its own name for this NEW surface rather than relying on
// quest-cta's (nonexistent) coverage to carry it.
describe('quest Wave F path-choice pressed state stays readable', () => {
  const cases: Array<[string, string]> = [
    [':root {', 'light fallback'],
    [':root:not([data-theme])', 'system dark'],
    ['[data-theme="dark"]', 'explicit dark'],
    ['[data-theme="light"]', 'explicit light'],
  ]
  for (const [kitSel, name] of cases) {
    it(`${name}: on-accent text reads on the solid accent fill`, () => {
      const kit = tokensOf(kitSel)
      expect(contrastRatio(kit['--text-on-accent'], kit['--text-accent']), `${name} text-on-accent on text-accent`).toBeGreaterThanOrEqual(4.5)
    })
  }
})
