import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'

const CSS = readFileSync(join(process.cwd(), 'themes', 'model-kit.css'), 'utf8')

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

describe('blog theme contrast', () => {
  it.each([['[data-theme="dark"]'], ['[data-theme="light"]']])('%s meets WCAG AA', (selector) => {
    const t = tokensOf(selector)
    expect(contrastRatio(t['--text-primary'], t['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t['--text-secondary'], t['--bg-primary'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t['--text-primary'], t['--bg-surface'])).toBeGreaterThanOrEqual(4.5)
  })
})
