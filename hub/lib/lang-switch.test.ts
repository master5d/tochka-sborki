import { describe, it, expect } from 'vitest'
import { langSwitchTarget } from './lang-switch'

describe('langSwitchTarget', () => {
  it('home ↔ home goes as a full document load (the cover function must re-decide)', () => {
    expect(langSwitchTarget('/')).toEqual({ href: '/en/', label: 'EN', isEn: false, document: true })
    expect(langSwitchTarget('/en/')).toEqual({ href: '/', label: 'RU', isEn: true, document: true })
    expect(langSwitchTarget('/en')).toEqual({ href: '/', label: 'RU', isEn: true, document: true })
  })
  it('hidden cover path points at the twin home, never at another hidden path', () => {
    expect(langSwitchTarget('/cover/trend-adweek-2026-09/')).toEqual({ href: '/en/', label: 'EN', isEn: false, document: true })
    expect(langSwitchTarget('/en/cover/trend-adweek-2026-09/')).toEqual({ href: '/', label: 'RU', isEn: true, document: true })
  })
  it('other pages keep client-side navigation to the mirrored route', () => {
    expect(langSwitchTarget('/blog/x/')).toEqual({ href: '/en/blog/x/', label: 'EN', isEn: false, document: false })
    expect(langSwitchTarget('/en/store/')).toEqual({ href: '/store/', label: 'RU', isEn: true, document: false })
  })
})
