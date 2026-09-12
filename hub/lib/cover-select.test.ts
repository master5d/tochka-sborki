import { describe, it, expect } from 'vitest'
import { chooseVariant, parseConfig } from './cover-select'

const COVER = 'trend-adweek-2026-09'
const base = { raw: null as string | null, defaultCover: null as string | null, cookie: null as string | null, rand: 0.5 }

describe('parseConfig', () => {
  it('absent key → null, garbage → invalid', () => {
    expect(parseConfig(null)).toBeNull()
    expect(parseConfig('{bad')).toBe('invalid')
    expect(parseConfig('[]')).toBe('invalid')
    expect(parseConfig('{"active":7}')).toBe('invalid')
  })
  it('valid config round-trips', () => {
    expect(parseConfig(`{"active":"floor","ab":{"cover":"${COVER}","share":20}}`)).toEqual({ active: 'floor', ab: { cover: COVER, share: 20 } })
    expect(parseConfig('{"active":"floor"}')).toEqual({ active: 'floor', ab: null })
  })
  it('share must be an integer 0–100, ab.cover a known non-floor cover', () => {
    expect(parseConfig(`{"active":"floor","ab":{"cover":"${COVER}","share":101}}`)).toBe('invalid')
    expect(parseConfig(`{"active":"floor","ab":{"cover":"${COVER}","share":2.5}}`)).toBe('invalid')
    expect(parseConfig('{"active":"floor","ab":{"cover":"floor","share":50}}')).toBe('invalid')
    expect(parseConfig('{"active":"floor","ab":{"cover":"trend-x-2030-01","share":50}}')).toBe('invalid')
  })
})

describe('chooseVariant', () => {
  it('no key and no default → floor', () => {
    expect(chooseVariant(base)).toMatchObject({ variant: 'floor', setCookie: null })
  })
  it('no key, preview default → that cover', () => {
    expect(chooseVariant({ ...base, defaultCover: COVER })).toMatchObject({ variant: COVER, reason: 'default' })
  })
  it('unknown default → floor', () => {
    expect(chooseVariant({ ...base, defaultCover: 'trend-x-2030-01' }).variant).toBe('floor')
  })
  it('broken config → floor even when a default exists', () => {
    expect(chooseVariant({ ...base, raw: '{bad', defaultCover: COVER })).toMatchObject({ variant: 'floor', reason: 'invalid-config' })
  })
  it('unknown active cover → floor', () => {
    expect(chooseVariant({ ...base, raw: '{"active":"trend-x-2030-01"}' }).variant).toBe('floor')
  })
  it('promoted cover without A/B → cover for everyone, no cookie', () => {
    expect(chooseVariant({ ...base, raw: `{"active":"${COVER}"}` })).toMatchObject({ variant: COVER, setCookie: null })
  })
  it('share 0 → active, no cookie, stale cookie ignored', () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":0}}`
    expect(chooseVariant({ ...base, raw, cookie: `${COVER}.30` })).toMatchObject({ variant: 'floor', setCookie: null })
  })
  it('share 100 → cover and a sticky cookie', () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":100}}`
    expect(chooseVariant({ ...base, raw, rand: 0.999 })).toMatchObject({ variant: COVER, setCookie: `${COVER}.100` })
  })
  it('cookie sticks while the share is unchanged', () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":20}}`
    expect(chooseVariant({ ...base, raw, cookie: `${COVER}.20`, rand: 0.99 })).toMatchObject({ variant: COVER, reason: 'sticky' })
    expect(chooseVariant({ ...base, raw, cookie: 'floor.20', rand: 0 })).toMatchObject({ variant: 'floor', reason: 'sticky' })
  })
  it('cookie from another share is re-rolled', () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":20}}`
    expect(chooseVariant({ ...base, raw, cookie: `${COVER}.50`, rand: 0.9 })).toMatchObject({ variant: 'floor', setCookie: 'floor.20', reason: 'rolled' })
    expect(chooseVariant({ ...base, raw, cookie: null, rand: 0.1 })).toMatchObject({ variant: COVER, setCookie: `${COVER}.20` })
  })
})
