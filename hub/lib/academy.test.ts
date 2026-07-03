import { describe, it, expect } from 'vitest'
import { getAcademy, getCourses } from './academy'

describe('academy registry reader', () => {
  it('reads the academy identity', () => {
    const a = getAcademy()
    expect(a.name).toBe('S.A.S.H.A')
    expect(a.fullName.ru.length).toBeGreaterThan(0)
    expect(a.fullName.en.length).toBeGreaterThan(0)
  })

  it('academy.url points at the hub landing (hub↔registry drift-guard)', () => {
    expect(getAcademy().url).toBe('https://mamaev.coach/academy')
  })

  it('localizes courses ru', () => {
    const c = getCourses('ru').find((x) => x.slug === 'tochka-sborki')
    expect(c).toBeDefined()
    expect(c!.url).toBe('https://ai.mamaev.coach')
    expect(c!.name).toBe('Точка Сборки')
  })

  it('localizes courses en', () => {
    const c = getCourses('en').find((x) => x.slug === 'tochka-sborki')
    expect(c!.name).toBe('Tochka Sborki')
  })
})
