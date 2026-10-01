import { describe, it, expect, vi } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { CARE_FALLBACK, careCopy, loadCareConfig, parseCareConfig, submitCare, validateCareFields, type CareFields } from './care'

const HUB = join(__dirname, '..')
const res = (status: number, body: unknown = {}) => ({ ok: status < 400, status, json: async () => body }) as Response
const asFetch = (fn: (...a: unknown[]) => Promise<Response>) => vi.fn(fn) as unknown as typeof fetch
const good: CareFields = { topic: 'tech', message: 'Страница магазина не грузится', email: 'a@b.co', pageUrl: '', company: '' }

describe('care desk — config', () => {
  it('fallback carries the closed topic list and the default response time (канон — lms-engine LMS/care.json)', () => {
    expect(CARE_FALLBACK.topics.map((t) => t.key)).toEqual(['access', 'stuck', 'content', 'tech', 'idea', 'other'])
    expect(CARE_FALLBACK.responseTime.ru).toBe('в течение 2 рабочих дней')
  })

  it('takes the live config from GET /api/care, rejects a malformed one', async () => {
    const live = { ...CARE_FALLBACK, responseTime: { ru: 'в течение суток', en: 'within a day' } }
    expect(await loadCareConfig(asFetch(async () => res(200, live)))).toEqual(live)
    expect(await loadCareConfig(asFetch(async () => res(200, { topics: [] })))).toBeNull()
    expect(await loadCareConfig(asFetch(async () => res(500)))).toBeNull()
    expect(await loadCareConfig(asFetch(async () => { throw new Error('net') }))).toBeNull()
    expect(parseCareConfig(null)).toBeNull()
  })

  it('page promises the configured response time', () => {
    expect(careCopy('ru').promises('в течение 2 рабочих дней').join(' ')).toContain('в течение 2 рабочих дней')
    expect(careCopy('en').success('within 2 business days')).toContain('within 2 business days')
  })
})

describe('care desk — form logic', () => {
  it('validates topic, message length and email', () => {
    expect(validateCareFields(good, CARE_FALLBACK)).toEqual([])
    expect(validateCareFields({ ...good, topic: 'x', message: 'hi', email: 'no' }, CARE_FALLBACK)).toEqual(['topic', 'message', 'email'])
  })

  it('POSTs /api/care as mamaev-coach with the honeypot; maps 429 / errors', async () => {
    const f = vi.fn(async () => res(200))
    expect(await submitCare(f as unknown as typeof fetch, good, 'ru')).toBe('ok')
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/care')
    expect(JSON.parse(String(init.body))).toMatchObject({ site: 'mamaev-coach', locale: 'ru', topic: 'tech', company: '' })
    expect(await submitCare(asFetch(async () => res(429)), good, 'en')).toBe('rate-limited')
    expect(await submitCare(asFetch(async () => res(502)), good, 'en')).toBe('error')
  })
})

describe('care desk — pages and link', () => {
  it('has /care/ and /en/care/ routes', () => {
    expect(existsSync(join(HUB, 'app', 'care', 'page.tsx'))).toBe(true)
    expect(readFileSync(join(HUB, 'app', 'en', 'care', 'page.tsx'), 'utf8')).toContain('<CareDesk locale="en" />')
  })

  it('home footer links the care desk in both locales', () => {
    const home = readFileSync(join(HUB, 'components', 'home-page.tsx'), 'utf8')
    expect(home).toContain("locale === 'en' ? '/en/care/' : '/care/'")
  })

  it('sitemap lists /care/ with its en pair', () => {
    const sm = readFileSync(join(HUB, 'app', 'sitemap.ts'), 'utf8')
    expect(sm).toContain('${SITE.url}/care/')
    expect(sm).toContain('${SITE.url}/en/care/')
  })
})
