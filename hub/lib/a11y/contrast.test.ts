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
