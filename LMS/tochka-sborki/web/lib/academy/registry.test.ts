import { describe, expect, it } from 'vitest'
import { REGISTRY, validateRegistry, resolveCourses, type AcademyRegistry } from './registry'
import { COURSE } from '@/lib/course'

/** Fresh valid registry per test — mutate freely. */
function sample(): AcademyRegistry {
  return structuredClone({
    academy: {
      name: 'S.A.S.H.A',
      fullName: { ru: 'Академия', en: 'Academy' },
      url: null,
    },
    courses: [
      {
        slug: 'tochka-sborki',
        name: { ru: 'Точка Сборки', en: 'Tochka Sborki' },
        tagline: { ru: 'курс по vibe-кодингу', en: 'a course on vibe coding' },
        url: 'https://ai.mamaev.coach',
        status: 'live' as const,
        locales: ['ru', 'en'] as const,
      },
    ],
  }) as AcademyRegistry
}

describe('validateRegistry', () => {
  it('accepts a valid registry', () => {
    expect(validateRegistry(sample())).toEqual([])
  })

  it('flags empty academy.name', () => {
    const r = sample()
    r.academy.name = '  '
    expect(validateRegistry(r)).toContain('academy.name is empty')
  })

  it('flags academy.fullName missing a locale', () => {
    const r = sample()
    r.academy.fullName.en = ''
    expect(validateRegistry(r)).toContain('academy.fullName must be non-empty in ru and en')
  })

  it('flags academy.url with trailing slash', () => {
    const r = sample()
    r.academy.url = 'https://academy.example.com/'
    expect(validateRegistry(r)).toContain('academy.url must be null or https:// without trailing slash')
  })

  it('flags a bad slug', () => {
    const r = sample()
    r.courses[0].slug = 'Tochka_Sborki'
    expect(validateRegistry(r)).toContain('courses[Tochka_Sborki]: slug must match ^[a-z0-9-]+$')
  })

  it('flags duplicate slugs', () => {
    const r = sample()
    r.courses.push(structuredClone(r.courses[0]))
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: duplicate slug')
  })

  it('flags a course name missing a locale', () => {
    const r = sample()
    r.courses[0].name.ru = ''
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: name must be non-empty in ru and en')
  })

  it('flags a course tagline missing a locale', () => {
    const r = sample()
    r.courses[0].tagline.en = '   '
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: tagline must be non-empty in ru and en')
  })

  it('flags a non-https course url', () => {
    const r = sample()
    r.courses[0].url = 'http://ai.mamaev.coach'
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: url must be https:// without trailing slash')
  })

  it('flags an unknown status', () => {
    const r = sample()
    ;(r.courses[0] as { status: string }).status = 'archived'
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: status must be one of live, coming-soon')
  })

  it('flags empty locales', () => {
    const r = sample()
    ;(r.courses[0] as unknown as { locales: string[] }).locales = []
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: locales must be a non-empty subset of ru, en')
  })

  it('flags an unknown locale', () => {
    const r = sample()
    ;(r.courses[0] as unknown as { locales: string[] }).locales = ['ru', 'de']
    expect(validateRegistry(r)).toContain('courses[tochka-sborki]: locales must be a non-empty subset of ru, en')
  })

  it('flags a registry with no live course', () => {
    const r = sample()
    r.courses[0].status = 'coming-soon'
    expect(validateRegistry(r)).toContain('registry must contain at least one live course')
  })
})

describe('REGISTRY (committed LMS/registry.json)', () => {
  it('round-trips validation cleanly', () => {
    expect(validateRegistry(REGISTRY)).toEqual([])
  })
})

describe('resolveCourses', () => {
  it('localizes ru', () => {
    const [c] = resolveCourses('ru', sample())
    expect(c).toEqual({
      slug: 'tochka-sborki',
      name: 'Точка Сборки',
      tagline: 'курс по vibe-кодингу',
      url: 'https://ai.mamaev.coach',
      status: 'live',
    })
  })

  it('localizes en', () => {
    const [c] = resolveCourses('en', sample())
    expect(c.name).toBe('Tochka Sborki')
    expect(c.tagline).toBe('a course on vibe coding')
  })

  it('defaults to REGISTRY and preserves order', () => {
    const list = resolveCourses('ru')
    expect(list.map((c) => c.slug)).toEqual(REGISTRY.courses.map((c) => c.slug))
  })
})

describe('COURSE ↔ registry drift-guard', () => {
  const entry = REGISTRY.courses.find((c) => c.slug === 'tochka-sborki')

  it('this course is registered', () => {
    expect(entry).toBeDefined()
  })

  it('registry entry matches lib/course COURSE', () => {
    expect(entry!.url).toBe(COURSE.domain)
    expect(entry!.name.ru).toBe(COURSE.name)
    expect([...entry!.locales]).toEqual([...COURSE.locales])
  })
})
