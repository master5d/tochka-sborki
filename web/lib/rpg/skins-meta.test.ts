import { describe, it, expect } from 'vitest'
import { SKINS_META } from './skins-meta'

describe('SKINS_META mentor personas', () => {
  it('every non-wanderer skin has a named mentor with a glyph', () => {
    for (const [skin, meta] of Object.entries(SKINS_META)) {
      if (skin === 'wanderer') continue
      expect(meta.mentor?.name.ru.length ?? 0).toBeGreaterThan(0)
      expect(meta.mentor?.name.en.length ?? 0).toBeGreaterThan(0)
      expect(meta.mentor?.glyph.length ?? 0).toBeGreaterThan(0)
    }
  })
})
