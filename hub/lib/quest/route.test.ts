import { describe, expect, it } from 'vitest'
import { quest } from './content'
import { buildRoute, obstacleNoun, routeText, type PathMarks } from './route'

describe('obstacleNoun', () => {
  it('strips the "Obstacle N. " lead-in (en)', () => {
    expect(obstacleNoun('Obstacle 1. The boulder')).toBe('The boulder')
    expect(obstacleNoun('Obstacle 2. The teacher')).toBe('The teacher')
    expect(obstacleNoun('Obstacle 3. The gates')).toBe('The gates')
  })

  it('strips the "Препятствие N. " lead-in (ru)', () => {
    expect(obstacleNoun('Препятствие 1. Валун')).toBe('Валун')
    expect(obstacleNoun('Препятствие 2. Учитель')).toBe('Учитель')
    expect(obstacleNoun('Препятствие 3. Ворота')).toBe('Ворота')
  })

  it('leaves the noun\'s own case untouched', () => {
    expect(obstacleNoun('Obstacle 1. the boulder')).toBe('the boulder')
  })

  it('falls back to the trimmed original when there is no "N." lead-in', () => {
    expect(obstacleNoun('The boulder')).toBe('The boulder')
    expect(obstacleNoun('  The boulder  ')).toBe('The boulder')
  })

  it('matches every fork\'s obstacle in both locales, deriving a non-empty noun', () => {
    for (const loc of ['ru', 'en'] as const) {
      for (const fork of quest[loc].forks) {
        const noun = obstacleNoun(fork.obstacle)
        expect(noun.length, `${loc} ${fork.id}: "${fork.obstacle}" -> "${noun}"`).toBeGreaterThan(0)
        expect(noun).not.toMatch(/^\d/)
      }
    }
  })
})

describe('buildRoute', () => {
  const c = quest.en

  it('three marks give a route with one step per fork, in fork order', () => {
    const marks: PathMarks = { boulder: 'detour', temple: 'habit', gates: 'detour' }
    const route = buildRoute(marks, c)
    expect(route).not.toBeNull()
    expect(route!.map((s) => s.forkId)).toEqual(['boulder', 'temple', 'gates'])
    expect(route!.map((s) => s.mark)).toEqual(['detour', 'habit', 'detour'])
    expect(route![0].obstacleNoun).toBe(obstacleNoun(c.forks[0].obstacle))
    expect(route![0].roadLabel).toBe(c.labels.detour)
    expect(route![1].obstacleNoun).toBe(obstacleNoun(c.forks[1].obstacle))
    expect(route![1].roadLabel).toBe(c.labels.habit)
  })

  it('the three entries are DISTINCT from one another for three distinct forks — the property that broke the flat "The habit road (the Scroller) x3" route', () => {
    const marks: PathMarks = { boulder: 'habit', temple: 'habit', gates: 'habit' } // same road at all three
    const route = buildRoute(marks, c)!
    const entries = route.map((s) => `${s.obstacleNoun} — ${s.roadLabel}`)
    expect(new Set(entries).size).toBe(3)
    // and the same holds for ru
    const routeRu = buildRoute(marks, quest.ru)!
    const entriesRu = routeRu.map((s) => `${s.obstacleNoun} — ${s.roadLabel}`)
    expect(new Set(entriesRu).size).toBe(3)
  })

  it('zero marks give null', () => {
    expect(buildRoute({}, c)).toBeNull()
  })

  it.each([
    ['one mark', { boulder: 'habit' } satisfies PathMarks],
    ['two marks', { boulder: 'habit', temple: 'detour' } satisfies PathMarks],
  ])('a partial set (%s) gives null, never a half-built route', (_name, marks) => {
    expect(buildRoute(marks, c)).toBeNull()
  })
})

describe('routeText', () => {
  it('joins each fork\'s obstacle noun and road label with the footer\'s own separator', () => {
    const c = quest.en
    const marks: PathMarks = { boulder: 'detour', temple: 'habit', gates: 'detour' }
    const route = buildRoute(marks, c)!
    const text = routeText(route)
    expect(text).toBe(
      `${obstacleNoun(c.forks[0].obstacle)} — ${c.labels.detour} · ${obstacleNoun(c.forks[1].obstacle)} — ${c.labels.habit} · ${obstacleNoun(c.forks[2].obstacle)} — ${c.labels.detour}`,
    )
  })

  it('never repeats itself when the same road is taken at every fork (ru)', () => {
    const c = quest.ru
    const marks: PathMarks = { boulder: 'habit', temple: 'habit', gates: 'habit' }
    const route = buildRoute(marks, c)!
    const text = routeText(route)
    expect(text).toBe('Валун — Привычная дорога · Учитель — Привычная дорога · Ворота — Привычная дорога')
    const parts = text.split(' · ')
    expect(new Set(parts).size).toBe(3)
  })
})
